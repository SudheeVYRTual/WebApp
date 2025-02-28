import { motion } from "framer-motion";
import penguinImg from "../assets/penguin.png"; // Place your PNG/SVG file in the assets folder

const Penguin = ({ message }) => {
  return (
    <div className="penguin-container">
      {/* Chat Bubble */}
      {message && (
        <motion.div
          className="chat-bubble"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {message}
        </motion.div>
      )}

      {/* Animated Penguin */}
      <motion.img
        src={penguinImg}
        alt="Penguin"
        className="penguin"
        animate={{ rotate: [0, -5, 0, 5, 0] }} // Handshake movement
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default Penguin;
