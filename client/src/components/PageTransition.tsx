import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const panels = ['#ff0000', '#0a0a0a', '#ff0000'];

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname}>
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Three-panel wipe overlay */}
      <AnimatePresence>
        <motion.div key={`overlay-${location.pathname}`} className="page-overlay-container" style={{ pointerEvents: 'none' }}>
          {panels.map((color, i) => (
            <motion.div
              key={i}
              className="page-overlay-panel"
              style={{ background: color }}
              initial={{ scaleY: 0, transformOrigin: 'bottom' }}
              animate={{ scaleY: [0, 1, 1, 0], transformOrigin: ['bottom', 'bottom', 'top', 'top'] }}
              transition={{
                duration: 0.9,
                delay: i * 0.06,
                ease: [0.76, 0, 0.24, 1],
                times: [0, 0.4, 0.6, 1],
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
