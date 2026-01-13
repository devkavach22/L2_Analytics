// ============================================
// STATS BAR - REPORT STATISTICS DISPLAY
// ============================================

interface StatsBarProps {
  totalReports: number;
  successRate: number;
  timeSaved: number;
}

export const StatsBar = ({ totalReports, successRate, timeSaved }: StatsBarProps) => {
  return (
    <div className="flex items-center gap-6 bg-white/40 p-3 rounded-2xl border border-white/50 backdrop-blur-sm shadow-sm">
      <div className="px-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Reports Generated
        </div>
        <div className="text-2xl font-black text-slate-800">{totalReports}</div>
      </div>
      
      <div className="h-8 w-px bg-slate-200/50" />
      
      <div className="px-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Success Rate
        </div>
        <div className="text-2xl font-black text-green-600">{successRate}%</div>
      </div>
      
      <div className="h-8 w-px bg-slate-200/50" />
      
      <div className="px-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Time Saved
        </div>
        <div className="text-2xl font-black text-orange-600">{timeSaved}h</div>
      </div>
    </div>
  );
};

export default StatsBar;
