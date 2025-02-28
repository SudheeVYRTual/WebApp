import { useLocation } from "react-router-dom";
import { useAudio } from "../contexts/AudioContext"; // Use the global audio context

const BackgroundMusic = () => {
    const { isPlaying, setIsPlaying, volume, setVolume } = useAudio();
    const location = useLocation();

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
