import { Directive } from "@/domain/models/directive";

interface DirectiveSidebarProps {
  directives: Directive[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isEditing: boolean;
}

const CATEGORIES = [
  { id: "campaign",      icon: "🚀", label: "Campaign Strategy" },
  { id: "content",       icon: "✍️", label: "Content Creation" },
  { id: "audience",      icon: "👥", label: "Audience Targeting" },
  { id: "monetization",  icon: "💰", label: "Monetization" },
  { id: "custom",        icon: "⚙️", label: "Custom" },
];

export function DirectiveSidebar({ directives, selectedId, onSelect, onNew, isEditing }: DirectiveSidebarProps) {
  return (
    <div className="w-64 shrink-0 flex flex-col" style={{ background: "#0a0614", borderRight: "1px solid rgba(139,92,246,0.12)" }}>
      <div className="p-4 border-b border-purple-500/10">
        <h2 className="text-xs font-black text-purple-300 uppercase tracking-widest mb-3">✍️ Prompt Studio</h2>
        <button onClick={onNew} className="w-full py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md">
          + New Directive
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {directives.map(d => {
          const cat = CATEGORIES.find(c => c.id === d.category);
          const isSelected = selectedId === d.id;
          return (
            <button key={d.id} onClick={() => onSelect(d.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${isSelected && !isEditing ? "bg-purple-600/20 border border-purple-500/30" : "hover:bg-purple-900/20 border border-transparent"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{cat?.icon}</span>
                <span className="text-xs font-bold text-white truncate flex-1">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-purple-400/40">{d.platforms.join(" · ")}</span>
                {d.campaignCount > 0 && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono">
                    {d.campaignCount} campaigns
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
