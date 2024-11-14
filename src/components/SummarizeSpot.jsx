import { useState, useEffect } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';
import './navigation.css';

function SummarizeSpot({ setTripConfig, closeInitModal }) {
    const [userResponse, setUserResponse] = useState('');
    const [processedText, setProcessedText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [remainingTime, setRemainingTime] = useState(30);
    const [micPermission, setMicPermission] = useState(true);
    const [voiceAvailable, setVoiceAvailable] = useState(false);
    const { speak, voices } = useSpeechSynthesis();
    let mediaRecorder;
    let interval;

    const timeToRecord = 10;

    useEffect(() => {
        setTimeout(() => {
            if (voices.length > 0) {
                setVoiceAvailable(true);
                console.log("Available voices:", voices);
            } else {
                console.error("Text-to-Speech voices are not available.");
            }
        }, 300); // Wait for 300 ms to let voices load
    }, [voices]);

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

    // processing response
    async function processResponse(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob);
            formData.append('model', 'whisper-1');

            // Call ChatGPT
            console.log("Sending audio for transcription...");
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
            console.log("Transcription successful:", transcriptText);

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
                        { role: 'user', content: `Correct spelling and grammar for: "${transcriptText}" ` },
                    ],
                }),
            });

            if (!chatGPTResponse.ok) {
                throw new Error(`ChatGPT API error: ${chatGPTResponse.status}`);
            }

            const gptData = await chatGPTResponse.json();
            setProcessedText(gptData.choices[0].message.content);
            console.log("Response after summarization:", gptData.choices[0].message.content);
        } catch (error) {
            console.error('Error processing response:', error);
            setProcessedText('There was an error processing your response.');
        }
    }

    // start recording the response
    const startRecording = () => {
        setIsListening(true);
        setRemainingTime(timeToRecord);

        console.log("Requesting microphone access for recording...");
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                mediaRecorder = new MediaRecorder(stream);
                const audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    setIsListening(false);
                    console.log("Recording stopped, processing audio...");
                    processResponse(audioBlob);
                };

                mediaRecorder.start();
                console.log("Recording started...");

                interval = setInterval(() => {
                    setRemainingTime((prev) => {
                        if (prev <= 5) {
                            clearInterval(interval);
                            if (mediaRecorder.state !== 'inactive') {
                                mediaRecorder.stop();
                            }
                            return 0;
                        }
                        return prev - 5;
                    });
                }, 5000);
            })
            .catch((error) => {
                console.error('Microphone access error:', error);
                setMicPermission(false);
                setIsListening(false);
            });
    };

    // Buttons to control recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            console.log("Manually stopping recording...");
            mediaRecorder.stop();
        }
        clearInterval(interval);
        setIsListening(false);
    };

    const eraseAndReRecord = () => {
        // Reset states and clear any existing intervals or mediaRecorder
        setUserResponse('');
        setProcessedText('');
        setRemainingTime(timeToRecord);
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        clearInterval(interval);

        // Start a new recording session
        startRecording();
    };

    const addMoreTime = () => {
        setRemainingTime((prev) => prev + 10);
    };

    const askQuestion = () => {
        if (voiceAvailable && voices.length > 0) {
            console.log("Asking question via Text-to-Speech...");
            const voice = voices[1];
            console.log("Using voice:", voice);
            speak({ text: 'What is the title of your trip.', voice });
            startRecording();
        } else {
            console.error("Text-to-Speech voices are unavailable.");
        }
    };

    useEffect(() => {
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className='pict-modal--overlay'>
                <div className='pict-modal--content'>
                    <div className='pict-modal--header'>
                        <div className='pict-modal--title'>Initialization</div>
                        <button className='pict-modal--close-button' onClick={() => { closeInitModal() }}>X</button>
                    </div>
                    <div className='pict-modal--body'>
                        {!micPermission && <p style={{ color: 'red' }}>Microphone access is denied. Please enable it in your browser settings.</p>}
                        <button onClick={askQuestion} disabled={!micPermission || !voiceAvailable}>
                            What is the title of your trip.
                        </button>
                        {isListening && <p>Listening... Time left: {remainingTime} seconds</p>}

                        <button onClick={addMoreTime} disabled={!isListening}>
                            Add 10 more seconds
                        </button>

                        <button onClick={stopRecording} disabled={!isListening}>
                            Stop Recording Now
                        </button>

                        <button onClick={eraseAndReRecord}>
                            Erase and Re-record
                        </button>

                        {processedText && (
                            <div>
                                <h4>Processed Summary:</h4>
                                <p>{processedText}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SummarizeSpot;