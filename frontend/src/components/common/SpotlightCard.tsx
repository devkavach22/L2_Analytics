// ============================================
// SPOTLIGHT CARD - MOUSE FOLLOWING GLOW CARD
// ============================================

import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SpotlightCard = ({ children, className = '' }: SpotlightCardProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        'group relative border border-slate-200 bg-white overflow-hidden',
        className
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(249, 115, 22, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
};

export default SpotlightCard;
