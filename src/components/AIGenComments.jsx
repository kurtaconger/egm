import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSpeechSynthesis } from 'react-speech-kit';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RestoreIcon from '@mui/icons-material/Restore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { db } from '../utils/firebase';

import './locationDetails.css';

const AIGenComments = ({ currentMarker, tripID, user }) => {
    // State variables
    const [userResponse, setUserResponse] = useState('');
    const [showInstruction, setShowInstruction] = useState(true);
    const [processedText, setProcessedText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [remainingTime, setRemainingTime] = useState(30);
    const [micPermission, setMicPermission] = useState(true);
    const [voiceAvailable, setVoiceAvailable] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { speak, voices } = useSpeechSynthesis();
    
    // Refs
    const mediaRecorderRef = useRef(null);
    const intervalRef = useRef(null);

    // Constants for Text-to-Speech and ChatGPT processing
    const currentSpotName = currentMarker?.shortName || 'the location';
    const voiceNumber = 1;
    const initialQuestion = `What is the most memorable experience at your stop at ${currentSpotName}`;
    const preQuestionForChatGPT = `I was asked what is the most memorable experience visit to ${currentSpotName}, summarize my response which follows: `;

    // Reset component state when currentMarker changes
    useEffect(() => {
        setUserResponse('');
        setProcessedText('');
        setIsListening(false);
        setRemainingTime(30);
    }, [currentMarker]);

    // Load available voices for Text-to-Speech
    useEffect(() => {
        const loadVoices = async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            if (voices.length > 0) {
                setVoiceAvailable(true);
                console.log("Available voices:", voices);
            } else {
                console.error("Text-to-Speech voices are not available.");
            }
        };
        loadVoices();
    }, [voices]);

    // Check for microphone permissions
    useEffect(() => {
        console.log("Checking microphone permissions...");
        navigator.permissions.query({ name: 'microphone' }).then((result) => {
            if (result.state === 'granted') {
                console.log("Microphone permission granted.");
                setMicPermission(true);
            } else {
                console.warn("Microphone permission denied or not available.");
                setMicPermission(false);
            }
        }).catch((error) => {
            console.error("Error checking microphone permissions:", error);
        });
    }, []);

    // Function to ask the user the initial question using Text-to-Speech
    const askQuestion = () => {
        if (voiceAvailable && voices.length > 0) {
            console.log("Asking question via Text-to-Speech...");
            const voice = voices[voiceNumber];
            console.log("Using voice:", voice);
            speak({ text: initialQuestion, voice });
            startRecording(); // Begin recording after question is asked
        } else {
            console.error("Text-to-Speech voices are unavailable.");
        }
    };

    // Automatically ask the question when voices are loaded and available
    useEffect(() => {
        if (voiceAvailable) askQuestion();
    }, [voiceAvailable]);

    // Clear interval when component unmounts
    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    // Start recording user's response via microphone
    const startRecording = () => {
        setIsListening(true);
        setRemainingTime(30);
        setProcessedText(`Listening . . . ${remainingTime} seconds left. Press button below for more time`);

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                mediaRecorderRef.current = new MediaRecorder(stream);
                const audioChunks = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    setIsListening(false);
                    processResponse(audioBlob); // Process the audio once recording stops
                };

                mediaRecorderRef.current.start();
                // Update remaining time every 5 seconds
                intervalRef.current = setInterval(() => {
                    setRemainingTime((prev) => {
                        const newTime = prev - 5;
                        if (newTime <= 0) {
                            clearInterval(intervalRef.current);
                            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                                mediaRecorderRef.current.stop();
                            }
                            return 0;
                        }
                        setProcessedText(`Listening . . . ${newTime} seconds left. Press button below for more time`);
                        return newTime;
                    });
                }, 5000);
            })
            .catch((error) => {
                console.error('Microphone access error:', error);
                setMicPermission(false);
                setIsListening(false);
            });
    };

    // Process the audio response and send it to ChatGPT for summarization
    async function processResponse(audioBlob) {
        try {
            setIsProcessing(true);
            setProcessedText("Converting to text and summarizing your response");

            // Send audio to Whisper API for transcription
            const formData = new FormData();
            formData.append('file', audioBlob);
            formData.append('model', 'whisper-1');

            const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
                },
                body: formData,
            });

            if (!whisperResponse.ok) {
                throw new Error(`Whisper API error: ${whisperResponse.status}`);
            }

            const transcriptionData = await whisperResponse.json();
            const transcriptText = transcriptionData.text;
            setUserResponse(transcriptText);

            // Send transcribed text to ChatGPT for summarization
            const chatGPTResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that summarizes and corrects grammar.' },
                        { role: 'user', content: `${preQuestionForChatGPT} "${transcriptText}".` },
                    ],
                }),
            });

            if (!chatGPTResponse.ok) {
                throw new Error(`ChatGPT API error: ${chatGPTResponse.status}`);
            }

            const gptData = await chatGPTResponse.json();
            setProcessedText(gptData.choices[0].message.content);
            console.log("ChatGPT processing successful.");
        } catch (error) {
            console.error('Error processing response:', error);
            setProcessedText('There was an error processing your response.');
        } finally {
            setIsProcessing(false);
        }
    }

    // Save summarized response to Firebase
    const saveSummary = async () => {
        const docRef = doc(db, `TRIP-${tripID}-DATA`, currentMarker.id);
        const newContent = `<p><span color="${user.hexColor}" data-color="${user.hexColor}" style="color: ${user.hexColor}">[${user.displayName}] ${processedText}</span></p>`;
    
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const currentContent = docSnap.data().content || "";
                const updatedContent = currentContent ? currentContent + newContent : newContent;
                await updateDoc(docRef, { content: updatedContent });
                console.log("Summary saved:", updatedContent);
    
                // Hide the instruction message
                setShowInstruction(false);
    
                setProcessedText(`Your most memorable experience for ${currentSpotName} was saved to the joint narrative. Press the "Edit Comments" button above to see the joint narrative.`);
            } else {
                console.error("Document does not exist!");
            }
        } catch (error) {
            console.error("Error saving summary:", error);
        }
    };
    

    // Stop recording manually and start processing
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            clearInterval(intervalRef.current); // Clear the interval to stop time updates
            setProcessedText("Recording stopped. Your words are being translated and summarized");
            mediaRecorderRef.current.stop();
        }
    };

    // Add more recording time
    const addMoreTime = () => {
        setRemainingTime((prev) => prev + 10);
        setProcessedText(`Listening . . . ${remainingTime + 10} seconds left. Press button below for more time`);
    };

    // Erase the current recording and start over
    const eraseAndReRecord = () => {
        setUserResponse('');
        setProcessedText(`Listening . . . ${remainingTime} seconds left. Press button below for more time`);
        startRecording();
    };

    return (
        <div className="genai--container">
            {!micPermission && <p style={{ color: 'red' }}>Microphone access is denied. Please enable it in your browser settings.</p>}

            <textarea
                className="genai--textarea"
                value={processedText}
                onChange={(e) => setProcessedText(e.target.value)}
                placeholder="Listening . . ."
            />


            {showInstruction && !isListening && !isProcessing && processedText && (
                <p className="genai--instruction">
                    Update the summary created by ChatGPT, then press 'Save' below to save to the joint narrative.
                </p>
            )}


            <div className="genai--button-container">
                <button className="genai--button" onClick={addMoreTime} disabled={!isListening}>
                    <MoreTimeIcon /> Add More Time
                </button>
                <button className="genai--button" onClick={stopRecording} disabled={!isListening}>
                    <HighlightOffIcon /> Stop Recording
                </button>
                <button className="genai--button" onClick={eraseAndReRecord}>
                    <RestoreIcon /> Erase and Re-record
                </button>
                <button className="genai--button" onClick={saveSummary}>
                    <CloudUploadIcon /> Save to Cloud
                </button>
            </div>
        </div>
    );
};

AIGenComments.propTypes = {
    currentMarker: PropTypes.shape({
        id: PropTypes.string.isRequired,
        shortName: PropTypes.string,
    }).isRequired,
    tripID: PropTypes.string.isRequired,
    user: PropTypes.shape({
        displayName: PropTypes.string.isRequired,
    }).isRequired,
};

export default AIGenComments;



