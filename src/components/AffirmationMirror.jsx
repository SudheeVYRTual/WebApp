import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/affirmationMirror.css";
import penguinImg from "../assets/penguin.png";
import { getAffirmations, postGeminiMoodAnalysis, postGeminiTextSimilarity } from "../services/api";

const AffirmationMirror = ({ onComplete }) => {
    const navigate = useNavigate();
    const webcamRef = React.useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [bubbleEffect, setBubbleEffect] = useState("float-in");
    const [isListening, setIsListening] = useState(false);
    const [affirmationSpoken, setAffirmationSpoken] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [affirmations, setAffirmations] = useState([]);
    const [dailyCompleted, setDailyCompleted] = useState(false);
    const [mood, setMood] = useState("neutral");
    const [showQuestionnaire, setShowQuestionnaire] = useState(true);
    const [moodInputType, setMoodInputType] = useState(""); // "text" or "options"
    const [userMoodResponse, setUserMoodResponse] = useState("");
    const [bubblePosition, setBubblePosition] = useState('right');
    const [showPenguin, setShowPenguin] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [penguinPosition, setPenguinPosition] = useState("left");
    const [userOptionsCount, setUserOptionsCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleOptionChange = (e) => {
        setUserOptionsCount((prev) => prev + parseInt(e.target.value));
    };

    const getJWTToken = () => {
        const token = localStorage.getItem('token');
        return token;
    };

    useEffect(() => {
        const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = false;
            recog.lang = "en-US";
            recog.onend = () => setIsListening(false);
            setRecognition(recog);
        } else {
          console.warn("Speech Recognition not supported in this browser.");
        }
    }, []);

    const geminiMoodAnalysis = async (text) => {
        try {
            const response = await postGeminiMoodAnalysis(text, getJWTToken());
            setMood(response.data.mood);
        } catch (error) {
          console.error("Error analyzing mood:", error);
        }
    };

    const optionsMoodAnalysis = (userOptionsCount) => {
        try {
            if (userOptionsCount < 0 ) return "neutral";
            else if (userOptionsCount >= 12) return "positive";
            else if (userOptionsCount >= 6) return "neutral";
            else return "negative";
        } catch (error) {
            console.error("Error analyzing mood:", error);
        }
    };

    const fetchAffirmations = async () => {
        setLoading(true);
        try {
            const response = await getAffirmations(mood, getJWTToken());
            setAffirmations(response.data.affirmations);
        } catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!showQuestionnaire) fetchAffirmations();
    }, [mood, showQuestionnaire]);

    const startListening = () => {
        if (recognition && !isListening) {
        setIsListening(true);
        recognition.start();
        recognition.onresult = (event) => {
            const spokenText = event.results[0][0].transcript;
            checkSimilarity(spokenText, affirmations[currentIndex]);
    }}};

    const handleNextAffirmation = () => {
        if (affirmationSpoken) {
            if (currentIndex < affirmations.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setAffirmationSpoken(false);
                setBubbleEffect("float-in");
                setBubblePosition((prev) => (prev === "left" ? "right" : "left"));
                setFeedbackMessage("");
            } else {
                localStorage.setItem("lastAffirmationDate", new Date().toISOString().split("T")[0]);
                setDailyCompleted(true);
                onComplete();
            }
        } else {
            setFeedbackMessage("Please speak the affirmation first.");
        }
    };

    const checkSimilarity = async (spokenText, expectedText) => {
    //   console.log("Checking similarity...");
    //   console.log("Spoken text:", spokenText);
    //   console.log("Expected text:", expectedText);

        if (expectedText.toLowerCase().includes(spokenText.toLowerCase())) {
            setFeedbackMessage("Amazing! You are doing great!");
            setBubbleEffect("pop");
            setAffirmationSpoken(true);
            setShowPenguin(false);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }

        else{
            try {
                setFeedbackMessage("You said something different. Let's check the similarity...");
                const response = await postGeminiTextSimilarity(spokenText, expectedText, getJWTToken());
                const cosineSimilarity = response.data.cosineSimilarity;
                if (cosineSimilarity > 0.7) {
                    setFeedbackMessage("Great! You made your own similar affirmation!");
                    setBubbleEffect("pop");
                    setAffirmationSpoken(true);
                    setShowPenguin(false);
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 5000);
                } else {
                    setFeedbackMessage("Try again!");
                    setBubbleEffect("jiggle");
                    setPenguinPosition(bubblePosition === "left" ? "right" : "left");
                    setShowPenguin(true);
                    // Hide penguin after 2 seconds
                    setTimeout(() => setShowPenguin(false), 2000);
                }
            } catch (error) {
                console.error("Error checking similarity:", error);
                setFeedbackMessage("Error checking similarity. Please try again.");
            } 
        }
    };

    const handleReadAffirmation = () => {
        if (!window.speechSynthesis) {
            console.error("Web Speech API is not supported in this browser.");
            return;
        }
        const affirmation = affirmations[currentIndex];
        const utterance = new SpeechSynthesisUtterance(affirmation);
        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
    };

    const handleMoodSubmission = () => {
        if (moodInputType === "text") {
            geminiMoodAnalysis(userMoodResponse);
        } else if (moodInputType === "options") {
            console.log("options count: ",userOptionsCount);
            const optionMood = optionsMoodAnalysis(userOptionsCount);
            setMood(optionMood);
        }
        setShowQuestionnaire(false);
    };

    if (dailyCompleted) {
        return (
            <div className="mirror-container text-center d-flex flex-column justify-content-center align-items-center vh-100">
                <h2>Great Job! You've completed the affirmations. Hope you feel much better about yourself than before and have an insightful day. Go ahead to the dashboard and explore the other features.</h2>
                <button className="btn btn-primary mt-3" onClick={() => navigate("/dashboard")}>
                    Navigate to Dashboard
                </button>
            </div>
        );
    }

    if (showQuestionnaire) {
        return (
            <div className="mirror-container text-center d-flex flex-column justify-content-center align-items-center vh-100">
                <h1>Welcome to Your Affirmation Mirror</h1>
                <h2>How are you feeling today?</h2>
                <div className="mt-3">
                    <button className="btn btn-outline-primary m-2" onClick={() => setMoodInputType("text")}>
                        Enter a text response
                    </button>
                    <button className="btn btn-outline-secondary m-2" onClick={() => setMoodInputType("options")}>
                        Choose from options
                    </button>
                </div>
                {moodInputType === "text" && (
                    <div className="mt-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Describe your mood..."
                          value={userMoodResponse}
                          onChange={(e) => setUserMoodResponse(e.target.value)}
                        />
                        <button className="btn btn-primary mt-2" onClick={handleMoodSubmission}>
                            Submit
                        </button>
                    </div>
                )}

                {moodInputType === "options" && (
                    <div className="mt-3">
                        <p>1. How was your sleep last night?</p>
                        <select className="form-select" onChange={(e) => handleOptionChange(e)}>
                            <option value="-1">Select Your Vibe</option>
                            <option value="3">Great, I feel well-rested</option>
                            <option value="2">It was okay, but could be better</option>
                            <option value="1">I had trouble sleeping</option>
                            <option value="0">Barely slept at all</option>
                        </select>
                        <p>2. How do you feel about your day so far?</p>
                        <select className="form-select" onChange={(e) => handleOptionChange(e)}>
                            <option value="-1">Select Your Vibe</option>
                            <option value="3">It's going really well!</option>
                            <option value="2">It's been fine, nothing special</option>
                            <option value="1">I'm feeling a bit off</option>
                            <option value="0">It's been a bad day</option>
                        </select>
                        <p>3. How is your energy level?</p>
                        <select className="form-select" onChange={(e) => handleOptionChange(e)}>
                            <option value="-1">Select Your Vibe</option>
                            <option value="3">I feel very energetic!</option>
                            <option value="2">I have enough energy to get through the day</option>
                            <option value="1">Feeling a little tired</option>
                            <option value="0">I'm completely drained</option>
                        </select>
                        <p>4. How social do you feel today?</p>
                        <select className="form-select" onChange={(e) => handleOptionChange(e)}>
                            <option value="-1">Select Your Vibe</option>
                            <option value="3">Excited to talk to people!</option>
                            <option value="2">I'm open to conversations but not too much</option>
                            <option value="1">Not in the mood to talk much</option>
                            <option value="0">I prefer to be alone today</option>
                        </select>
                        <p>5. How are you handling stress right now?</p>
                        <select className="form-select" onChange={(e) => handleOptionChange(e)}>
                            <option value="-1">Select Your Vibe</option>
                            <option value="3">I feel in control and calm</option>
                            <option value="2">A little stressed, but managing fine</option>
                            <option value="1">I'm struggling a bit</option>
                            <option value="0">I feel completely overwhelmed</option>
                        </select>

                        <button className="btn btn-primary mt-2" onClick={handleMoodSubmission}>
                            Submit
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
    <>
    {loading && (
        <div className="mirror-container d-flex flex-column justify-content-center align-items-center vh-100">
            <h2>Loading...</h2>
        </div>
    )}
    <div className="mirror-container d-flex flex-column justify-content-center align-items-center vh-100">
        <motion.div 
            className="mirror-frame flower-border d-flex justify-content-center align-items-center position-relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
        >
            <Webcam 
                ref={webcamRef} 
                mirrored 
                audio={false} 
                screenshotFormat="image/jpeg" 
                className="mirror-video" 
            />
        </motion.div>
        <motion.div
            key={currentIndex}
            className={`bubble soap-bubble text-center ${bubbleEffect} ${bubblePosition}`}
        >
            {affirmations[currentIndex]}
        </motion.div>

        <p className="feedback-message mt-3">{feedbackMessage}</p>

        <div className="mt-4 d-flex gap-3">
            {!affirmationSpoken ? (
                <button className="btn btn-primary btn-lg" onClick={startListening}>
                    {isListening ? "Listening..." : "Start Listening"}
                </button>
            ) : (
                <button className="btn btn-success btn-lg" onClick={handleNextAffirmation}>
                    {currentIndex < affirmations.length - 1 ? "Next Affirmation" : "Finish"}
                </button>
            )}
            <button className="btn btn-secondary btn-lg" onClick={handleReadAffirmation}>
                Read Affirmation
            </button>
        </div>
    </div>
    {showPenguin && (
        <motion.div
            key={penguinPosition}
            className={`penguin-container-pop-in ${penguinPosition}`}
            initial={{
                opacity: 0,
                x: penguinPosition === "right" ? 100 : -100, 
                y: 100, 
                rotate: penguinPosition === "right" ? -45 : 45
            }}
            animate={{
                opacity: 1,
                x: 0,
                y: 0,
                rotate: penguinPosition === "right" ? -45 : 45
            }}
            exit={{
                opacity: 0,
                x: penguinPosition === "right" ? -150 : 150, 
                y: -150, 
                rotate: penguinPosition === "right" ? -90 : 90  // Rotates further while leaving
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <div className="penguin-bubble-container">
                <div className="penguin-bubble">Try again!</div>
            </div>
            <img src={penguinImg} alt="Penguin" className="penguin-image" />
        </motion.div>
    )}
    {showConfetti && (
        <Confetti
            count={100}
            size={20}
            gravity={0.1}
            colors={['#FF69B4', '#FFC67D', '#8BC34A']}
            exit={{ duration: 2000 }}
        />
    )}

    </>
    );
};

export default AffirmationMirror;