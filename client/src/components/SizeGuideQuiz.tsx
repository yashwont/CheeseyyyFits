import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Q = { q: string; options: string[] };
const QUESTIONS: Q[] = [
  { q: 'What is your height?', options: ["Under 5'4\"", "5'4\" – 5'8\"", "5'8\" – 6'0\"", "Over 6'0\""] },
  { q: 'What is your build?', options: ['Slim', 'Regular', 'Athletic', 'Broad'] },
  { q: 'How do you prefer your fit?', options: ['Very tight', 'Fitted', 'Relaxed', 'Oversized'] },
];

const SIZE_MATRIX: Record<string, Record<string, string>> = {
  '0-0': 'XS', '0-1': 'XS', '0-2': 'S',  '0-3': 'S',
  '1-0': 'XS', '1-1': 'S',  '1-2': 'M',  '1-3': 'L',
  '2-0': 'S',  '2-1': 'M',  '2-2': 'L',  '2-3': 'XL',
  '3-0': 'M',  '3-1': 'L',  '3-2': 'XL', '3-3': 'XXL',
};

const TIP: Record<string, string> = {
  XS: 'Very slim fit — perfect for narrow shoulders and chest under 34".',
  S:  'Slim fit — suits chest 34–37". Goes great with our fitted tees.',
  M:  'Most popular size — chest 38–41". Works for both fitted and relaxed styles.',
  L:  'Relaxed fit — chest 42–45". Our hoodies look great in L.',
  XL: 'Generous fit — chest 46–49". Ideal for layering.',
  XXL:'Our biggest cut — chest 50"+. Oversized look guaranteed.',
};

interface Props { onClose: () => void }

export default function SizeGuideQuiz({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (i: number) => {
    const next = [...answers, i];
    if (step < QUESTIONS.length - 1) {
      setAnswers(next); setStep(step + 1);
    } else {
      const height = next[0]; const fit = next[2];
      setResult(SIZE_MATRIX[`${height}-${fit}`] || 'M');
    }
  };

  return (
    <div className="cart-overlay" style={{ zIndex: 600 }} onClick={onClose}>
      <motion.div className="size-quiz-modal" onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
        <div className="reviews-modal-header">
          <h3>FIT FINDER</h3>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 28 }}>
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="quiz-progress">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className={`quiz-dot ${i <= step ? 'quiz-dot-active' : ''}`} />
                  ))}
                </div>
                <p className="quiz-question">{QUESTIONS[step].q}</p>
                <div className="quiz-options">
                  {QUESTIONS[step].options.map((opt, i) => (
                    <motion.button key={opt} className="quiz-option"
                      onClick={() => handleAnswer(i)}
                      whileHover={{ borderColor: 'red', color: 'red' }}
                      whileTap={{ scale: 0.97 }}>
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <p style={{ color: '#666', fontSize: '0.8rem', letterSpacing: 2, marginBottom: 16 }}>YOUR RECOMMENDED SIZE</p>
                <motion.div className="quiz-result"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}>
                  {result}
                </motion.div>
                <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 24 }}>{TIP[result]}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="filter-clear" onClick={() => { setStep(0); setAnswers([]); setResult(null); }}>Retake</button>
                  <button className="filter-btn" style={{ flex: 1 }} onClick={onClose}>Got it</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
