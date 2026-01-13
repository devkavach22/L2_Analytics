// ============================================
// GRID PATTERN - BACKGROUND GRID EFFECT
// ============================================

import { motion } from 'framer-motion';

export const GridPattern = () => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-t from-[#FFFBF6] to-transparent"
      />
    </div>
  );
};

export default GridPattern;
