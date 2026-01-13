// ============================================
// GLASS CARD - GLASSMORPHISM CARD COMPONENT
// ============================================

import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className = '' }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[32px] border border-orange-100/60 bg-white/60 backdrop-blur-xl shadow-xl shadow-orange-900/5',
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent opacity-50" />
      {children}
    </div>
  );
};

export default GlassCard;
