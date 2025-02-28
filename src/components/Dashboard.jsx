import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css"; 


const Dashboard = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      navigate("/login");
    }
  }, [navigate]);
  return (
  <div className="dashboard-container">
    {/* Header */}
    <div className="dashboard-header">
      Welcome, {username}!
    </div>
    {/* Features Section */}
    <div className="dashboard-section">
      <h2 className="dashboard-title">Features</h2>
      <div className="feature-button-grid">
        <button className="feature-button" onClick={() => navigate("/chat")}>Penguin AI</button>
        <button className="feature-button" onClick={() => navigate("/affirmation-mirror")}>Affirmation Mirror</button>
        <button className="feature-button" onClick={() => navigate("/mood-capsule")}>Mood Capsule</button>
        <button className="feature-button" onClick={() => navigate("/journal")}>Journal</button>
        <button className="feature-button" onClick={() => navigate("/list-channels")}>Chat Channels</button>
      </div>
    </div>
    {/* Mini Games Section */}
    <div className="dashboard-section">
      <h2 className="dashboard-title">Mini Games</h2>
      <div className="feature-button-grid">
        <button className="feature-button" onClick={() => navigate("/bubble-pop")}>Bubble Pop Game</button>
      </div>
    </div>
  </div>
  );
};

export default Dashboard;
