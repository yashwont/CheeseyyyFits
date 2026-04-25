import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  const ringX = useSpring(dotX, { stiffness: 120, damping: 18, mass: 0.5 });
  const ringY = useSpring(dotY, { stiffness: 120, damping: 18, mass: 0.5 });

  const ringScale = useMotionValue(1);
  const ringOpacity = useMotionValue(1);
  const dotScale = useMotionValue(1);

  const isTouch = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)').matches);

  useEffect(() => {
    if (isTouch.current) return;

    const move = (e: MouseEvent) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
    };

    const onEnter = (e: Event) => {
      const el = e.target as HTMLElement;
      const isClickable = el.closest('button, a, [role="button"], input, textarea, select, label, .cursor-hover');
      if (isClickable) {
        ringScale.set(2.2);
        dotScale.set(0.4);
      }
    };

    const onLeave = () => {
      ringScale.set(1);
      dotScale.set(1);
    };

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
    };
  }, []);

  if (isTouch.current) return null;

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="cursor-ring"
        style={{
          x: ringX,
          y: ringY,
          scale: ringScale,
          opacity: ringOpacity,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
      {/* Inner dot */}
      <motion.div
        className="cursor-dot"
        style={{
          x: dotX,
          y: dotY,
          scale: dotScale,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </>
  );
}
