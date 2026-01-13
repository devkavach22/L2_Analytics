// ============================================
// TILT CARD - 3D TILT EFFECT CARD
// ============================================

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export const TiltCard = ({ children, className }: TiltCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  return (
    <motion.div
      style={{ x, y, rotateX, rotateY, z: 100 }}
      drag
      dragElastic={0.12}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      whileTap={{ cursor: 'grabbing' }}
      className={cn('cursor-grab perspective-1000', className)}
    >
      {children}
    </motion.div>
  );
};

export default TiltCard;
