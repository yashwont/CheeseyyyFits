import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Three panels: red → black → red for the wipe
const PANELS = ['#e8000d', '#050505', '#e8000d'];

const contentVariants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: 0.52, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: [0.76, 0, 0.24, 1] },
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <>
      {/* Page content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Three-panel wipe overlay — fires on every route change */}
      <AnimatePresence>
        <motion.div
          key={`wipe-${location.pathname}`}
          className="page-overlay-container"
          style={{ pointerEvents: 'none' }}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {PANELS.map((color, i) => (
            <motion.div
              key={i}
              className="page-overlay-panel"
              style={{ background: color }}
              initial={{ scaleY: 0, transformOrigin: 'bottom' }}
              animate={{
                scaleY: [0, 1, 1, 0],
                transformOrigin: ['bottom', 'bottom', 'top', 'top'],
              }}
              transition={{
                duration: 0.88,
                delay: i * 0.055,
                ease: [0.76, 0, 0.24, 1],
                times: [0, 0.38, 0.62, 1],
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
