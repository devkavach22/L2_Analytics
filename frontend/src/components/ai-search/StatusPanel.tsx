// ============================================
// STATUS PANEL - SYSTEM STATUS DISPLAY
// ============================================

import { Cpu, Zap } from 'lucide-react';

interface StatusPanelProps {
  isGenerating: boolean;
}

export const StatusPanel = ({ isGenerating }: StatusPanelProps) => {
  return (
    <div className="bg-[#0f172a] rounded-[2rem] p-6 relative overflow-hidden shadow-xl border border-slate-800 flex items-center justify-between h-[140px]">
      <div className="relative z-10">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
          System Status
        </h3>
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isGenerating
                ? 'bg-orange-500 animate-pulse'
                : 'bg-green-500 shadow-[0_0_10px_#22c55e]'
            }`}
          />
          <span className={`text-xl font-bold ${isGenerating ? 'text-white' : 'text-green-400'}`}>
            {isGenerating ? 'PROCESSING' : 'SYSTEM IDLE'}
          </span>
        </div>
        <p className="text-slate-500 text-xs mt-2 font-mono">
          {isGenerating ? 'Receiving intelligence stream...' : 'Waiting for input signal.'}
        </p>
      </div>
      
      <div className="relative z-10 w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
        {isGenerating ? (
          <Cpu className="text-orange-500 animate-spin" size={30} style={{ animationDuration: '3s' }} />
        ) : (
          <Zap className="text-slate-500" size={30} />
        )}
      </div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:1rem_1rem] pointer-events-none" />
    </div>
  );
};

export default StatusPanel;
