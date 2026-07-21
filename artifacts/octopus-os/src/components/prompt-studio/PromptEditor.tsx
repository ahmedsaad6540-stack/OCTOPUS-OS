import { Directive } from "@/domain/models/directive";

interface PromptEditorProps {
  draft: Partial<Directive>;
  setDraft: React.Dispatch<React.SetStateAction<Partial<Directive>>>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  mode: "new" | "edit";
}

const CATEGORIES = [
  { id: "campaign",      icon: "🚀", label: "Campaign Strategy" },
  { id: "content",       icon: "✍️", label: "Content Creation" },
  { id: "audience",      icon: "👥", label: "Audience Targeting" },
  { id: "monetization",  icon: "💰", label: "Monetization" },
  { id: "custom",        icon: "⚙️", label: "Custom" },
];
const TONES = ["Energetic", "Professional", "Conversational", "Inspiring", "Urgent", "Educational", "Humorous"];
const LANGUAGES = ["Arabic", "English", "French", "Spanish", "German", "Turkish"];
const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Facebook", "Pinterest", "Twitter"];
const NETWORKS = ["Digistore24", "ClickBank", "Amazon", "Impact", "ShareASale", "MaxBounty"];

export function PromptEditor({ draft, setDraft, onSave, onCancel, isSaving, mode }: PromptEditorProps) {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">{mode === "new" ? "✨ New Directive" : "✏️ Edit Directive"}</h1>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 border border-purple-500/30 hover:bg-purple-900/20 transition-all">Cancel</button>
          <button onClick={onSave} disabled={!draft.name?.trim() || !draft.userDirective?.trim() || isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40 flex items-center gap-2">
            {isSaving ? <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "💾"} Save Directive
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-purple-400/60 uppercase font-black tracking-wider block mb-2">Directive Name</label>
        <input type="text" value={draft.name ?? ""} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-800/40 text-white text-sm focus:outline-none focus:border-purple-500" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Category", key: "category", options: CATEGORIES.map(c => ({ value: c.id, label: `${c.icon} ${c.label}` })) },
          { label: "Tone", key: "tone", options: TONES.map(t => ({ value: t, label: t })) },
          { label: "Language", key: "language", options: LANGUAGES.map(l => ({ value: l, label: l })) },
        ].map(field => (
          <div key={field.key}>
            <label className="text-[10px] text-purple-400/60 uppercase font-black tracking-wider block mb-2">{field.label}</label>
            <select value={(draft as any)[field.key] ?? ""} onChange={e => setDraft(p => ({ ...p, [field.key]: e.target.value }))}
              className="w-full px-3 py-3 rounded-xl bg-black/40 border border-purple-800/40 text-white text-sm focus:outline-none focus:border-purple-500">
              {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] text-purple-400/60 uppercase font-black tracking-wider block mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const active = (draft.platforms ?? []).includes(p as any);
              return (
                <button key={p} type="button" onClick={() => setDraft(prev => ({
                  ...prev, platforms: active ? (prev.platforms ?? []).filter(x => x !== p) : [...(prev.platforms ?? []), p as any]
                }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${active ? "bg-purple-600/30 border-purple-500/50 text-purple-300" : "border-purple-500/10 text-purple-400/40"}`}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-purple-400/60 uppercase font-black tracking-wider block mb-2">Affiliate Network</label>
          <select value={draft.affiliateNetwork ?? "Digistore24"} onChange={e => setDraft(p => ({ ...p, affiliateNetwork: e.target.value as any }))}
            className="w-full px-3 py-3 rounded-xl bg-black/40 border border-purple-800/40 text-white text-sm focus:outline-none focus:border-purple-500">
            {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-purple-400/60 uppercase font-black tracking-wider block mb-2">🧠 System Prompt</label>
        <textarea rows={5} value={draft.systemPrompt ?? ""} onChange={e => setDraft(p => ({ ...p, systemPrompt: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-800/40 text-white text-sm focus:outline-none focus:border-purple-500 font-mono resize-none" />
      </div>

      <div>
        <label className="text-[10px] text-purple-400/60 uppercase font-black tracking-wider block mb-2">🎯 Campaign Directive</label>
        <textarea rows={10} value={draft.userDirective ?? ""} onChange={e => setDraft(p => ({ ...p, userDirective: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-purple-500/40 bg-[#0a0614] text-white text-sm focus:outline-none font-mono resize-none" />
      </div>
    </div>
  );
}
