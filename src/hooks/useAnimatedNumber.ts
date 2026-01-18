// src/hooks/useAnimatedNumber.ts
import { useEffect, useState, useRef } from "react";

export function useAnimatedNumber(target: number, duration = 500) {
  const [display, setDisplay] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(display);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = performance.now();
    startRef.current = start;
    fromRef.current = display;

    const step = (timestamp: number) => {
      if (!startRef.current) return;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const value = fromRef.current + (target - fromRef.current) * progress;
      setDisplay(Math.floor(value));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return display;
}
