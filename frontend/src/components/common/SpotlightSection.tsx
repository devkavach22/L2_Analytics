// ============================================
// SPOTLIGHT SECTION - MOUSE FOLLOW EFFECT
// ============================================

import React from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpotlightSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const SpotlightSection = ({ children, className = '' }: SpotlightSectionProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn('relative group overflow-hidden', className)}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(249, 115, 22, 0.06), transparent 80%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
};

export default SpotlightSection;
