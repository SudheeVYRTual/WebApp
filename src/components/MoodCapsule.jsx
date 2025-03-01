import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Button, Container, Form, Modal, Badge } from "react-bootstrap";
import { Sun, Moon, Flame } from "lucide-react";
import axios from "axios";

const moodsList = ["Happy", "Sad", "Excited", "Anxious", "Calm", "Tired"];

const MoodCapsule = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [moodEntries, setMoodEntries] = useState([]);
  const [selectedMood, setSelectedMood] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalText, setJournalText] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);

  // Streak tracking
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastEntryDate, setLastEntryDate] = useState(null);
  const [streakUpdated, setStreakUpdate] = useState(false);

  // Mood entry editing
  const [moodEditModal, setMoodEditModal] = useState(false);
  const [editMoodEntry, setEditMoodEntry] = useState(null);
  const [editedMessage, setEditedMessage] = useState("");
  
  // Journal entry editing
  const [journalEditModal, setJournalEditModal] = useState(false);
  const [editJournalEntry, setEditJournalEntry] = useState(null);
  const [editedJournalText, setEditedJournalText] = useState("");

  const getJWTToken = () => {
    const token = localStorage.getItem('token');
    console.log("hiii", token)
    return token;
};

  // Calculate streak on initial load and when journal entries change
  useEffect(() => {
    calculateStreak();
  }, [journalEntries]);

  const calculateStreak = () => {
    if (streakUpdated) return 
    if (journalEntries.length === 0) {
      setCurrentStreak(0);
      setLastEntryDate(null);
      return;
    }

    // Sort entries by date (newest first)
    const sortedEntries = [...journalEntries].sort((a, b) => 
      new Date(b.time) - new Date(a.time)
    );

    // Get the most recent entry date
    const mostRecentEntry = new Date(sortedEntries[0].time);
   
    setLastEntryDate(mostRecentEntry);
    
    // Format dates to compare just the date part (not time)
    const formatDateString = (date) => {
      return date.toLocaleDateString();
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if the most recent entry was today or yesterday
    const mostRecentDateStr = formatDateString(mostRecentEntry);
    const todayStr = formatDateString(today);
    const yesterdayStr = formatDateString(yesterday);

    // If latest entry is not from today or yesterday, reset streak
    if (mostRecentDateStr !== todayStr && mostRecentDateStr !== yesterdayStr) {
      setCurrentStreak(0);
      return;
    }
    else{
      setCurrentStreak((prev)=> prev+1);
      setStreakUpdate(true);

    }

    
    // Update best streak if needed
    if (currentStreak > bestStreak) {
      setBestStreak(currentStreak);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const addMoodEntry = async () => {
    if (selectedMood && newMessage) {
      const newEntry = {
        mood: selectedMood,
        message: newMessage,
      };
      setMoodEntries([...moodEntries, newEntry]);
      setSelectedMood("");
      setNewMessage("");
      
      try {
        const res = await axios.post("http://localhost:5000/api/journals/mood-entries", newEntry
        );
        setMoodEntries([...moodEntries, res.data]);
      } catch (err) {
        console.error("Error saving mood entry:", err);
      }
    }
  };
  
  const addJournalEntry = async () => {
    if (journalText) {const newJournal = {
      msg: journalText,
      streak: currentStreak
    };
    setJournalEntries([...journalEntries, newJournal]);
    
  
      try {
        const res = await axios.post("http://localhost:5000/api/journals/journal-entries", newJournal
        );
        console.log(res.data)
        setJournalEntries([...journalEntries, res.data]);
      } catch (err) {
        console.error("Error saving journal entry:", err);
      }
      setJournalText("");
  
    }
  };
  
  // Fetch mood entries from MongoDB on component mount
  useEffect(() => {
    axios.get("http://localhost:5000/api/journals/mood-entries"
    ).then((res) => {
      setMoodEntries(res.data);
    });
  }, []);
  
  // Fetch journal entries from MongoDB on component mount
  useEffect(() => {
    axios.get("http://localhost:5000/api/journals/journal-entries"
    ).then((res) => {
      console.log(res.data)
      setJournalEntries(res.data);
    });
  }, []);
  

  const toggleMessageVisibility = (id) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  // Mood entry operations
  const deleteMoodEntry = (id) => {
    console.log(id)
    setMoodEntries(moodEntries.filter((entry) => entry._id !== id));
    axios.delete(`http://localhost:5000/api/journals/mood-entries/${id}`
    )
    .then((res) => console.log(res.data))
    .catch(err => console.error("Error deleting mood entry:", err));
  };

  const openMoodEditModal = (entry) => {
    setEditMoodEntry(entry);
    setEditedMessage(entry.message);
    setMoodEditModal(true);
  };

  const saveEditedMoodMessage = () => {
    setMoodEntries(
      moodEntries.map((entry) =>
        entry._id === editMoodEntry._id ? { ...entry, message: editedMessage } : entry
      )
    );
    setMoodEditModal(false);
  };

  // Journal entry operations
  const deleteJournalEntry = (id) => {
    console.log(id)
    setJournalEntries(journalEntries.filter((entry) => entry._id !== id));
    axios.delete(`http://localhost:5000/api/journals/journal-entries/${id}`)
    .then((res) => console.log(res.data))
    .catch(err => console.error("Error deleting journal entry:", err));
  };

  const openJournalEditModal = (entry) => {
    setEditJournalEntry(entry);
    setEditedJournalText(entry.text);
    setJournalEditModal(true);
  };

  const saveEditedJournalEntry = () => {
    setJournalEntries(
      journalEntries.map((entry) =>
        entry._id === editJournalEntry._id ? { ...entry, text: editedJournalText } : entry
      )
    );
    setJournalEditModal(false);
  };

  // Get streak message
  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "Start journaling today to build your streak!";
    } else if (currentStreak === 1) {
      return "You started your streak today! Come back tomorrow.";
    } else {
      return `You've journaled for ${currentStreak} days in a row!`;
    }
  };

  // Check if user should journal today to maintain streak
  const shouldJournalToday = () => {
    // if (!lastEntryDate.toLocaleDateString()) return true;
    const today = new Date();
    const lastEntryDay = new Date(lastEntryDate);
    
    return formatDateString(today) !== formatDateString(lastEntryDay);
  };

  // Helper function to format date for comparison
  const formatDateString = (date) => {
    return date;
  };

  return (
    <div className={darkMode ? "bg-dark text-light min-vw-100" : "bg-light text-dark min-vw-100"} style={{ paddingBottom: "50px" }}>
      <Container  style={{marginRight: "50px"}} className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: darkMode ? "#FFD1DC" : "#6A0572" }}>Mood Capsule</h2>
          <Button style={{marginRight: "50px"}} variant={darkMode ? "light" : "dark"} onClick={toggleDarkMode}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />} {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>

        {/* Mood Capsule Form */}
        <Form className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>Mood</Form.Label>
            <Form.Select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)}>
              <option value="">Select a mood</option>
              {moodsList.map((mood, index) => (
                <option key={index} value={mood}>
                  {mood}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Describe how you feel"
            />
          </Form.Group>
          <Button onClick={addMoodEntry} variant="primary">
            Add Entry
          </Button>
        </Form>

        {/* Mood Capsule Cards */}
        <div className="d-flex flex-wrap gap-3">
          {moodEntries.map((entry) => (
            <Card
              key={entry._id}
              className={darkMode ? "bg-secondary text-white" : "bg-white text-dark"}
              style={{ width: "18rem", cursor: "pointer", backgroundColor: "#FFD1DC", maxHeight: 300, overflowX: "auto" }}
            >
              <Card.Body onClick={() => toggleMessageVisibility(entry._id)}>
                <Card.Title>{entry.mood}</Card.Title>
                <Card.Text>
                  <small>{(entry.time)}</small><br/>
                  {expandedEntryId === entry._id ? entry.message : "🔒 Locked"}
                </Card.Text>
              </Card.Body>
              {/* Edit & Delete Buttons */}
              <div className="d-flex justify-content-between px-3 pb-3">
                <Button variant="warning" size="sm" onClick={(e) => { e.stopPropagation(); openMoodEditModal(entry); }}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); deleteMoodEntry(entry._id); }}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Mood Edit Modal */}
        <Modal show={moodEditModal} onHide={() => setMoodEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Mood Capsule</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Edit Message</Form.Label>
              <Form.Control as="textarea" value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setMoodEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveEditedMoodMessage}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        <hr className="my-5" />
        
        {/* Journal Section with Streak */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <h2 style={{ color: darkMode ? "#FFD1DC" : "#6A0572" }}>Journal</h2>
            <div className="d-flex align-items-center">
              {/*<Flame size={24} color="#FF6B6B" />*/}
              <div className="ms-2">
                <h5 className="mb-0">
                🐧Streak: {currentStreak} days
                  {bestStreak > 0 && <span className="ms-2 text-muted">(Best: {bestStreak})</span>}
                </h5>
                <small className={shouldJournalToday() ? "text-danger" : "text-success"}>
                  {shouldJournalToday() ? "Journal today to maintain your streak!" : "Streak updated for today!"}
                </small>
              </div>
            </div>
          </div>
          
          <div className="bg-info text-white p-3 rounded mb-4 mt-2">
            <p className="mb-0"><Flame size={16} className="me-1" /> {getStreakMessage()}</p>
          </div>
        </div>
        
        <Form className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>Write Your Thoughts</Form.Label>
            <Form.Control
              style={{ height: 200 }}
              as="textarea"
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Express yourself..."
            />
          </Form.Group>
          <Button onClick={addJournalEntry} variant="primary">
            Save Journal Entry
          </Button>
        </Form>

        {/* Journal Cards */}
        <div className="d-flex flex-wrap gap-3">
          {journalEntries.map((entry) => (
            <div>
            <Card
              key={entry._id}
              className={darkMode ? "bg-secondary text-white" : "bg-white text-dark"}
              style={{ width: "18rem", height: 300, overflowX: "auto", backgroundColor: "#FFD1DC" }}
            >
              <Card.Body>
                <Card.Title>Your Journal</Card.Title>
                <small><b>{entry.time}</b></small>
                <Card.Text>{entry.msg}</Card.Text>
              </Card.Body>
              
            </Card>
            <div className="d-flex justify-content-between px-3 pb-3" style={{marginTop:10}}>
            <Button variant="warning" size="sm" onClick={() => openJournalEditModal(entry)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => deleteJournalEntry(entry._id)}>
              Delete
            </Button>
          </div>
          </div>

          ))}
        </div>

        {/* Journal Edit Modal */}
        <Modal show={journalEditModal} onHide={() => setJournalEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Journal Entry</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Edit Journal</Form.Label>
              <Form.Control 
                as="textarea" 
                style={{ height: 200 }}
                value={editedJournalText} 
                onChange={(e) => setEditedJournalText(e.target.value)} 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setJournalEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveEditedJournalEntry}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default MoodCapsule;