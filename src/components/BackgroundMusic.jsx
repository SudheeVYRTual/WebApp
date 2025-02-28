import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import bgMusic from "../assets/sounds/relaxingBg.mp3"

const BackgroundMusic = () => {
    const audioRef = useRef(new Audio(bgMusic)); 
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(0.3); 
    const location = useLocation();
    
    // Ensure music plays throughout app
    useEffect(() => {
      const audio = audioRef.current;
      audio.loop = true;
      audio.volume = volume;
      
      if (isPlaying) {
        audio.play().catch(() => console.log("Autoplay prevented"));
      }
    
      return () => {
        audio.pause();
      };
    }, [isPlaying, volume]);
  
    // Only show controls on the dashboard
    const showControls = location.pathname === "/dashboard";
  
    return (
      showControls && (
        <div className="music-controls">
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? "🔇 Mute" : "🔊 Play"}
          </button>
          <button onClick={() => setVolume(Math.max(0, volume - 0.1))}>➖ Decrease Vol</button>
          <button onClick={() => setVolume(Math.min(1, volume + 0.1))}>➕ Increase Vol</button>
        </div>
      )
    );
};

export default BackgroundMusic;
