// ============================================
// ANIMATED BACKGROUND - BLOB ANIMATION
// ============================================

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-200/30 rounded-full blur-[120px] animate-blob mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-200/30 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
    </div>
  );
};

export default AnimatedBackground;
