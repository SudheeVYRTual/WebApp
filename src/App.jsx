import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import AffirmationMirror from "./components/AffirmationMirror";
import ChannelList from "./components/ChannelList";
import ChannelChat from "./components/ChannelChat";
import sb from "./components/SendBird";

const App = () => {
  const [user, setUser] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);

  const [dailyCompleted, setDailyCompleted] = useState(useState(() => {
    const lastCompletionDate = localStorage.getItem("lastAffirmationDate");
    const today = new Date().toLocaleDateString();
    return lastCompletionDate === today;
  }));
  
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    console.log(username)
    if (userId && username) {
      const userData = {
        userId: username,
        nickname: username
      };
      
      setUser(userData);
      handleSendBirdLogin(userData);
    }
  }, []);

  const handleChannelSelect = (channel) => {
    setCurrentChannel(channel);
  };

  const handleLeaveChannel = () => {
    setCurrentChannel(null);
  };

  const handleAffirmationComplete = () => {
    const today = new Date().toLocaleDateString();
    localStorage.setItem("lastAffirmationDate", today);
    setDailyCompleted(true);
    console.log("Affirmation Completed");
  };

  const handleSendBirdLogin = (user) => {
    sb.connect(user.nickname, (sbUser, error) => {
      if (error) {
        console.error('SendBird login failed:', error);
        alert('Chat service login failed!');
      } else {
        sb.updateCurrentUserInfo(user.nickname || user.name, null, (res, err) => {
          if (err) console.error('Nickname update failed:', err);
          console.log('Connected to chat service successfully');
        });

        sb.setChannelInvitationPreference(false, (response, error) => {
          if (error) {
            console.error("Failed to set invitation preference:", error);
            return;
          }
          console.log("Invitation preference set to manual acceptance.");
        });
      }
    });
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
        <Route
          path="/list-channels"
          element={
            user ? (
              <div>
                {!currentChannel ? (
                  <ChannelList user={user} onChannelSelect={handleChannelSelect} />
                ) : (
                  <>
                    {console.log("Current Channel:", currentChannel)}
                    <ChannelChat
                      channel={currentChannel} 
                      onLeaveChannel={handleLeaveChannel} 
                    />
                  </>
                )}
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
