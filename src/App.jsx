import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import AffirmationMirror from "./components/AffirmationMirror";

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
      </Routes>
    </Router>
  );
};

export default App;
