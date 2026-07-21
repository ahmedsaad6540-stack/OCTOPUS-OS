import { Directive } from "@/domain/models/directive";

interface PromptPreviewProps {
  current: Directive;
  onEdit: () => void;
  onTest: () => void;
  onLaunch: () => void;
  isLaunching: boolean;
}

export function PromptPreview({ current, onEdit, onTest, onLaunch, isLaunching }: PromptPreviewProps) {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">{current.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400">{current.category}</span>
            <span className="text-[10px] text-purple-400/40">· {current.tone} · {current.language}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onEdit} className="px-3 py-2 rounded-xl text-xs font-bold text-purple-300 border border-purple-500/20 hover:bg-purple-900/20 transition-all">✏️ Edit</button>
          <button onClick={onTest} className="px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 border border-cyan-500/20 hover:bg-cyan-900/20 transition-all">🧪 Test AI</button>
          <button onClick={onLaunch} disabled={isLaunching}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
            {isLaunching ? <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
            🚀 Launch Campaign
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {current.platforms.map(p => <span key={p} className="px-3 py-1 rounded-lg bg-purple-900/30 border border-purple-500/20 text-purple-300 text-xs font-bold">{p}</span>)}
        <span className="px-3 py-1 rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-emerald-300 text-xs font-bold">💰 {current.affiliateNetwork}</span>
        <span className="px-3 py-1 rounded-lg bg-blue-900/20 border border-blue-500/20 text-blue-300 text-xs font-bold">📊 {current.campaignCount} campaigns</span>
      </div>

      <div className="glass-card p-4 rounded-xl border border-purple-500/10">
        <div className="text-[10px] text-purple-400/50 uppercase font-black tracking-widest mb-3">🧠 System Prompt</div>
        <p className="text-sm text-purple-200/80 font-mono whitespace-pre-wrap">{current.systemPrompt}</p>
      </div>

      <div className="rounded-xl border border-purple-500/30 overflow-hidden bg-[#0a0614]">
        <div className="px-4 py-3 border-b border-purple-500/20 bg-purple-500/5">
          <div className="text-[10px] text-purple-300 uppercase font-black tracking-widest">🎯 Campaign Directive</div>
        </div>
        <div className="p-4">
          <p className="text-sm text-white/90 font-mono whitespace-pre-wrap">{current.userDirective}</p>
        </div>
      </div>
    </div>
  );
}
