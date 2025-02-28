import { useState, useRef, useEffect } from "react";
import { sendMessage } from "../services/api";
import Penguin from "./PenguinModel";
import "../styles/Chat.css";

const ChannelChat = () => {
  const [input, setInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const bubbleRef = useRef(null);
  const recognitionRef = useRef(null);

  // 🎤 Voice Input (Speech-to-Text)
  const handleVoiceInput = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // 📢 AI Response Speech (Smooth, Natural Breaks)
  const speakResponse = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    let voices = synth.getVoices();

    // Ensure voices are loaded
    if (voices.length === 0) {
      setTimeout(() => {
        voices = synth.getVoices();
        selectAndSpeakVoice(voices, text);
      }, 200);
      return;
    }

    selectAndSpeakVoice(voices, text);
  };

  const selectAndSpeakVoice = (voices, text) => {
    const synth = window.speechSynthesis;
    
    // Select a cute voice
    const cuteVoice = voices.find((voice) => 
      voice.name.includes("Google UK English Female") || 
      voice.name.includes("Google US English Female") || 
      voice.name.includes("Samantha")
    ) || voices[0];

    // Remove special characters (e.g., emojis)
    const cleanText = text.replace(/[\u{1F300}-\u{1FAD6}]/gu, "").trim();

    // Split text at full stops and commas for natural pauses
    const parts = cleanText.split(/(?<=[.])\s+/);

    // Speak each part sequentially with natural pauses
    let index = 0;
    const speakNextPart = () => {
      if (index >= parts.length) return; // Stop when all parts are spoken

      const utterance = new SpeechSynthesisUtterance(parts[index]);
      utterance.voice = cuteVoice;
      utterance.rate = 1.1; // Normal speed for smoothness
      utterance.pitch = 1.5; // Higher pitch for a cute effect
      utterance.volume = 1; // Full volume

      utterance.onend = () => {
        index++;
        setTimeout(speakNextPart, 200); // Small delay for natural flow
      };

      synth.speak(utterance);
    };

    speakNextPart(); // Start speaking
  };

  // 📡 Handle Sending Message
  const handleSend = async () => {
    if (!input.trim()) return;
    setInput("");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!token) return alert("Not authenticated");

    setLoading(true);
    setAiResponse("thinking...");

    try {
      const res = await sendMessage(token, userId, input);
      setAiResponse(res.data.message);
      speakResponse(res.data.message); // Speak out AI response smoothly
    } catch (err) {
      console.log(err);
      setAiResponse("Error sending message");
    }

    setLoading(false);
  };

  // 🔄 Auto-scroll AI response bubble if text overflows
  useEffect(() => {
    if (bubbleRef.current) {
      bubbleRef.current.scrollTop = bubbleRef.current.scrollHeight;
    }
  }, [aiResponse]);

  return (
    <div className="chat-container">
      {/* Show Chat Bubble Only If There’s a Response */}
      {aiResponse && (
        <div className="chat-bubble" ref={bubbleRef}>
          {loading ? (
            <div className="thinking-dots"><span></span><span></span><span></span></div>
          ) : (
            aiResponse
          )}
        </div>
      )}

      {/* Large Penguin (Centered) */}
      <div className="penguin-container">
        <Penguin />
      </div>

      {/* Input Box */}
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
        />
        <button className="send-button" onClick={handleSend}>Send</button>
        <button className="voice-input-button" onClick={handleVoiceInput}>🎤</button>
      </div>

      {/* Voice Enable/Disable Toggle */}
      <button
        className="voice-toggle"
        onClick={() => setVoiceEnabled(!voiceEnabled)}
        style={{ backgroundColor: voiceEnabled ? "darkgray" : "lightgray" }}
      >
        {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
      </button>
    </div>
  );
};

export default ChannelChat;
