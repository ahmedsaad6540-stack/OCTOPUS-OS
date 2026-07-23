import { Campaign } from "@/domain/models/campaign";

interface CampaignToolbarProps {
  onNew: () => void;
  onStartEngine: () => void;
  isEngineStarting: boolean;
  isFormOpen: boolean;
}

export function CampaignToolbar({ onNew, onStartEngine, isEngineStarting, isFormOpen }: CampaignToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-black text-white font-heading">🚀 الحملات ومحرك الأرباح</h1>
        <p className="text-purple-400 font-semibold text-sm mt-1">إدارة الحملات التسويقية ونظام Profit Engine الآلي</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onNew} className="px-5 py-2.5 rounded-xl font-bold transition-all text-sm bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-800/60">
          {isFormOpen ? "✕ Cancel" : "+ New Campaign"}
        </button>
        <button onClick={onStartEngine} disabled={isEngineStarting}
          className="px-6 py-2.5 rounded-xl font-bold transition-all text-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50 flex items-center gap-2">
          {isEngineStarting ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "💰"} 
          Start Profit Engine
        </button>
      </div>
    </div>
  );
}
