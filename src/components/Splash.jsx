import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";

const dots = [
  { x: "18%", y: "30%", size: 8, delay: 0 },
  { x: "75%", y: "22%", size: 6, delay: 0.4 },
  { x: "30%", y: "68%", size: 10, delay: 0.8 },
  { x: "82%", y: "62%", size: 7, delay: 1.2 },
  { x: "55%", y: "80%", size: 5, delay: 0.6 },
];

export default function Splash({ onDone }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(onDone, 300);
          return 100;
        }
        return p + 4;
      });
    }, 60);
    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="splash-dot"
          style={{ left: d.x, top: d.y, width: d.size, height: d.size }}
          animate={{ y: [0, -14, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: d.delay }}
        />
      ))}

      <motion.div
        className="splash-logo"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <HeartPulse size={44} color="#e8eefc" strokeWidth={1.6} />
      </motion.div>

      <motion.h1
        className="splash-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        CARESYNC
      </motion.h1>

      <motion.p
        className="splash-tagline"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        Patients • Doctors • Appointments
      </motion.p>

      <div className="splash-bar">
        <div className="splash-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </motion.div>
  );
}