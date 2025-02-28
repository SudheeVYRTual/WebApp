import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import AffirmationMirror from "./components/AffirmationMirror";
import BubblesPopGame from "./components/Bubblepop";
import BackgroundMusic from "./components/BackgroundMusic";
import SettingsButton from "./components/SettingsButton";

const App = () => {
  const [dailyCompleted, setDailyCompleted] = useState(useState(() => {
    const lastCompletionDate = localStorage.getItem("lastAffirmationDate");
    const today = new Date().toLocaleDateString();
    return lastCompletionDate === today;
  }));
  
      
  const handleAffirmationComplete = () => {
    const today = new Date().toLocaleDateString();
    localStorage.setItem("lastAffirmationDate", today);
    setDailyCompleted(true);
    console.log("Affirmation Completed");
  };
  return (
    <Router>
      <BackgroundMusic />
      <SettingsButton />
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route
          path="/dashboard"
          element={
            dailyCompleted ? (
              <Dashboard />
            ) : (
              <Navigate to="/affirmation-mirror" replace />
            )
          }
        />
        <Route path='/affirmation-mirror' element={<AffirmationMirror onComplete={handleAffirmationComplete}/>}/>
        <Route path='/bubble-pop' element={<BubblesPopGame/>}/>
      </Routes>
    </Router>
  );
};

export default App;
