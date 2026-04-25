import { useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

export function useTilt(intensity = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const rotateX = useSpring(rawX, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rawY, { stiffness: 200, damping: 20 });

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rawX.set(-(py - 0.5) * intensity);
    rawY.set((px - 0.5) * intensity);
  };

  const onMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}
