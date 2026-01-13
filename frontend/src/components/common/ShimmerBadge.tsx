// ============================================
// SHIMMER BADGE - ANIMATED BADGE COMPONENT
// ============================================

import { LucideIcon } from 'lucide-react';

interface ShimmerBadgeProps {
  text: string;
  icon: LucideIcon;
}

export const ShimmerBadge = ({ text, icon: Icon }: ShimmerBadgeProps) => {
  return (
    <div className="relative inline-flex overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F97316_0%,#FFF_50%,#F97316_100%)]" />
      <span className="inline-flex h-full w-full cursor-default items-center justify-center rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-orange-600 backdrop-blur-3xl">
        <Icon size={12} className="mr-2" />
        {text}
      </span>
    </div>
  );
};

export default ShimmerBadge;
