import { useState, useEffect } from "react";
import { useSpeechSynthesis } from "react-speech-kit";
import "./navigation.css";

function Initialize({ setTripConfig, closeInitModal }) {
  const [tripTitle, setTripTitle] = useState("");
  const [majorStops, setMajorStops] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [responseReceived, setResponseReceived] = useState(false);
  const { speak, voices } = useSpeechSynthesis();
  const [micPermission, setMicPermission] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const timeToRecord = 10;
  let mediaRecorder;

  useEffect(() => {
    if (voices.length > 0) setVoiceAvailable(true);
    
    navigator.permissions.query({ name: "microphone" })
      .then((result) => setMicPermission(result.state === "granted"))
      .catch((error) => console.error("Microphone permission error:", error));
    
    // Delay asking the first question until after the component loads
    const askFirstQuestionTimer = setTimeout(() => {
      if (micPermission && voiceAvailable) askQuestion();
    }, 1000);

    return () => clearTimeout(askFirstQuestionTimer);
  }, [voices, micPermission, voiceAvailable]);

  // Ask a question based on the current question number
  useEffect(() => {
    if (responseReceived) {
      setResponseReceived(false);
      if (currentQuestion === 1) setCurrentQuestion(2);
      askQuestion();
    }
  }, [responseReceived]);

  const askQuestion = () => {
    const questions = [
      "What is the title of your trip?",
      "How many major stops did you make during the trip? Please answer with a number."
    ];

    if (voiceAvailable && voices.length > 0) {
      speak({ text: questions[currentQuestion - 1], voice: voices[1] });
      setTimeout(() => startRecording(), 1500); // Start recording after a delay to avoid recording the question
    }
  };

  const startRecording = () => {
    setIsListening(true);
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
      mediaRecorder.onstop = () => processResponse(new Blob(audioChunks, { type: "audio/wav" }));

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
      }, timeToRecord * 1000);
    }).catch((error) => console.error("Microphone access error:", error));
  };

  const processResponse = async (audioBlob) => {
    setIsListening(false);
    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("model", "whisper-1");

    try {
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
        body: formData,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const { text } = await response.json();
      handleResponse(text);
    } catch (error) {
      console.error("Error processing response:", error);
    }
  };

  const handleResponse = (text) => {
    setResponseReceived(true);

    if (currentQuestion === 1) {
      setTripTitle(text);
    } else if (currentQuestion === 2) {
      const stopsNumber = text.match(/\d+/); // Extract only the number from the response
      setMajorStops(stopsNumber ? stopsNumber[0] : "No number detected");
    }
  };

  return (
    <div className="pict-modal--overlay">
      <div className="pict-modal--content">
        <div className="pict-modal--header">
          <div className="pict-modal--title">Initialization</div>
          <button className="pict-modal--close-button" onClick={closeInitModal}>X</button>
        </div>
        <div className="pict-modal--body">
          {!micPermission && <p style={{ color: "red" }}>Microphone access is denied. Please enable it in your browser settings.</p>}
          {isListening && <p>Listening...</p>}
          {tripTitle && <p>Trip Title: {tripTitle}</p>}
          {majorStops && <p>Major Stops: {majorStops}</p>}
        </div>
      </div>
    </div>
  );
}

export default Initialize;

