// ============================================
// GLOW CARD - REUSABLE CARD COMPONENT
// ============================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const GlowCard = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
}: GlowCardProps) => {
  return (
    <motion.div
      onClick={onClick}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      whileHover={
        hoverEffect
          ? { y: -4, boxShadow: '0 20px 40px -12px rgba(249, 115, 22, 0.15)' }
          : {}
      }
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg shadow-orange-500/5 transition-all duration-300 group',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </motion.div>
  );
};

export default GlowCard;
