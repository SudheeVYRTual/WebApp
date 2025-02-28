import { createContext, useContext, useState, useEffect, useRef } from "react";
import bgMusic from "../assets/sounds/relaxingBg.mp3";

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(new Audio(bgMusic));
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.3);

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = volume;

    if (isPlaying) {
      audio.play().catch(() => console.log("Autoplay prevented"));
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [isPlaying, volume]);

  return (
    <AudioContext.Provider value={{ isPlaying, setIsPlaying, volume, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
