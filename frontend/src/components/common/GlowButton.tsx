// ============================================
// GLOW BUTTON - ANIMATED CTA BUTTON
// ============================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  to?: string;
  variant?: 'primary' | 'outline';
}

export const GlowButton = ({
  children,
  className,
  onClick,
  to,
  variant = 'primary',
}: GlowButtonProps) => {
  const isPrimary = variant === 'primary';

  const buttonClasses = cn(
    'relative group px-8 py-4 rounded-xl font-bold overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] text-base',
    isPrimary
      ? 'bg-slate-900 text-white shadow-lg shadow-orange-900/10'
      : 'bg-white text-slate-900 border border-slate-200 hover:border-orange-300 hover:text-orange-600 shadow-sm',
    className
  );

  const content = (
    <>
      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-[length:200%_auto] animate-gradient-x" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={buttonClasses}>
        {content}
      </Link>
    );
  }

  return (
    <motion.button onClick={onClick} className={buttonClasses}>
      {content}
    </motion.button>
  );
};

export default GlowButton;
