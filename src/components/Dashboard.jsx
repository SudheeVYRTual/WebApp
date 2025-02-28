import  { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const handleChatRedirect = () => {
    navigate("/chat");
  };

  const handleAffirmationMirrorRedirect = () => {
    navigate("/affirmation-mirror");
  };
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome, {username}</h1>
      <button onClick={handleChatRedirect} style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}>
        Go to Chat
      </button>
      <button onClick={handleAffirmationMirrorRedirect} style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}>
        Affirmation Mirror
      </button>
    </div>
  );
};

export default Dashboard;
