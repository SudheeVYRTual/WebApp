import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAudio } from "../contexts/AudioContext"; // Use global audio context
import controlsIcon from "../assets/controls.png";
import "../styles/settingsButton.css";

const SettingsButton = () => {
    const [showSettings, setShowSettings] = useState(false);
    const { isPlaying, setIsPlaying, volume, setVolume } = useAudio();
    const location = useLocation();

    // Hide settings on Dashboard (since controls are there)
    if (location.pathname === "/dashboard") return null;

    return (
    <div className="settings-container">
        <button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
            <img src={controlsIcon} alt="Settings" width={40} height={40} />
        </button>

        {showSettings && (
        <div className="settings-dropdown">
            <button onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? "🔇 Mute" : "🔊 Play"}
            </button>
            <button onClick={() => setVolume(Math.max(0, volume - 0.1))}>➖ Decrease Vol</button>
            <button onClick={() => setVolume(Math.min(1, volume + 0.1))}>➕ Increase Vol</button>
        </div>
        )}
    </div>
    );
};

export default SettingsButton;
