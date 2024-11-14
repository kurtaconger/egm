import { useState, useEffect } from "react";
import { useSpeechSynthesis, useSpeechRecognition } from "react-speech-kit";

function VoiceForm({ onSubmit }) {
  const { speak, voices } = useSpeechSynthesis();
  const { listen, listening, stop, transcript, resetTranscript } = useSpeechRecognition();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({ title: "", stops: "", startDate: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const questions = [
    "What is the title of your trip?",
    "How many stops did you make?",
    "When did it start?"
  ];

  useEffect(() => {
    if (voices.length > 0) {
      console.log("Voices loaded successfully:", voices);
      setVoicesLoaded(true);
    } else {
      console.warn("No voices available initially. Retrying to load voices...");
      const voiceLoadInterval = setInterval(() => {
        if (voices.length > 0) {
          console.log("Voices have been loaded on retry:", voices);
          setVoicesLoaded(true);
          clearInterval(voiceLoadInterval);
        } else {
          console.warn("Still no voices available, retrying...");
        }
      }, 1000);

      return () => clearInterval(voiceLoadInterval);
    }
  }, [voices]);

  const startProcess = () => {
    console.log("Starting voice question process...");
    askQuestion(currentQuestion);
  };

  const askQuestion = (questionIndex) => {
    const question = questions[questionIndex];
    console.log(`Asking question ${questionIndex + 1}: ${question}`);

    if (voicesLoaded && voices.length > 0) {
      const selectedVoice = voices[0];
      console.log("Using voice:", selectedVoice);
      speak({
        text: question,
        voice: selectedVoice,
        onend: () => {
          console.log("Finished speaking. Starting speech recognition...");
          listen();
        }
      });
    } else {
      console.error("No voices available for text-to-speech even after retry.");
    }
  };

  const handleNextQuestion = () => {
    const keys = ["title", "stops", "startDate"];
    setAnswers((prev) => ({
      ...prev,
      [keys[currentQuestion]]: transcript,
    }));

    console.log(`Captured answer for ${keys[currentQuestion]}: ${transcript}`);
    resetTranscript();
    stop();
    setCurrentQuestion((prev) => prev + 1);
  };

  useEffect(() => {
    if (!listening && transcript && currentQuestion < questions.length) {
      handleNextQuestion();
    }
  }, [listening, transcript]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("Submitting answers:", answers);
    onSubmit(answers);
  };

  return (
    <div>
      <h3>Fill out your trip details:</h3>
      <label>Title of the trip:</label>
      <input
        type="text"
        name="title"
        value={answers.title}
        onChange={handleInputChange}
        disabled={isEditing}
      />
      <label>Number of stops:</label>
      <input
        type="text"
        name="stops"
        value={answers.stops}
        onChange={handleInputChange}
        disabled={isEditing}
      />
      <label>Start date:</label>
      <input
        type="text"
        name="startDate"
        value={answers.startDate}
        onChange={handleInputChange}
        disabled={isEditing}
      />

      {currentQuestion >= questions.length ? (
        <button onClick={handleSubmit}>OK</button>
      ) : (
        <>
          <p>Listening for your answer...</p>
          <button onClick={startProcess}>Start Process</button>
        </>
      )}
    </div>
  );
}

export default VoiceForm;
