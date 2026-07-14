import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PROMPTS = [
  { id: "brain", icon: "🧠", name: "Brain Agent", category: "Core",
    prompt: "You are the Brain Agent of OCTOPUS NEXUS OS. Your role is to analyze trends, synthesize data from all agents, and provide strategic recommendations. Always be concise, data-driven, and actionable." },
  { id: "creator", icon: "✍️", name: "Creator Agent", category: "Core",
    prompt: "You are the Creator Agent. Generate engaging short-form video scripts, hooks, and CTAs optimized for virality. Each script must be unique, platform-specific, and conversion-focused." },
  { id: "publisher", icon: "📢", name: "Publisher Agent", category: "Core",
    prompt: "You are the Publisher Agent. Schedule and publish content across platforms at optimal times. Monitor engagement and adjust posting strategy based on performance data." },
  { id: "money", icon: "💰", name: "Money Agent", category: "Core",
    prompt: "You are the Money Agent. Track affiliate revenue, calculate ROI, identify top-performing products, and recommend budget allocation. Always maximize earnings per effort." },
  { id: "ceo", icon: "👔", name: "CEO Agent", category: "Core",
    prompt: "You are the AI CEO of OCTOPUS NEXUS OS. Synthesize all agent reports daily, identify bottlenecks, make strategic decisions, and present a morning briefing with actionable priorities." },
  { id: "trendhunter", icon: "📈", name: "TrendHunter", category: "Research",
    prompt: "You are the TrendHunter Agent. Scan TikTok, YouTube, and social platforms for viral trends. Extract patterns, identify rising niches, and alert the Brain Agent with opportunity scores." },
  { id: "tracker", icon: "📊", name: "Tracker Agent", category: "Analytics",
    prompt: "You are the Tracker Agent. Monitor campaign performance in real-time. Alert on anomalies, track conversion funnels, and provide hourly performance snapshots." },
  { id: "voice", icon: "🎤", name: "Voice Agent", category: "Creation",
    prompt: "You are the Voice Agent. Generate natural, engaging voiceovers optimized for short-form video. Match tone to platform — energetic for TikTok, professional for LinkedIn." },
  { id: "optimizer", icon: "⚡", name: "Optimizer Agent", category: "Analytics",
    prompt: "You are the Optimizer Agent. A/B test creatives, iterate on top performers, pause underperformers, and continuously improve conversion rates across all campaigns." },
  { id: "competitor", icon: "🕵️", name: "Competitor Agent", category: "Research",
    prompt: "You are the Competitor Agent. Monitor rival campaigns, analyze their strategies, identify gaps and opportunities, and provide weekly competitive intelligence reports." },
];

export function PromptStudioPage() {
  const { token } = useAuth();
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [selected, setSelected] = useState("brain");
  const [editing, setEditing] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const prompt = prompts.find(p => p.id === selected)!;
  const [draft, setDraft] = useState(prompt.prompt);

  const save = () => {
    setPrompts(ps => ps.map(p => p.id === selected ? { ...p, prompt: draft } : p));
    setEditing(false);
  };

  const runTest = async () => {
    if (!testInput.trim() || !token) return;
    setTesting(true); setTestOutput(""); setError("");
    try {
      // Try real AI completion via backend provider-configs
      const configsRes = await fetch("/api/provider-configs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const configs = configsRes.ok ? await configsRes.json() : [];
      const defaultConfig = Array.isArray(configs) ? configs.find((c: any) => c.isDefault) ?? configs[0] : null;

      if (defaultConfig) {
        const res = await fetch(`/api/provider-configs/${defaultConfig.id}/complete`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: prompt.prompt,
            messages: [{ role: "user", content: testInput }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setTestOutput(data.content ?? data.message ?? JSON.stringify(data));
          setTesting(false);
          return;
        }
      }
      // Fallback: show helpful message
      setError("⚠️ No AI provider configured. Go to AI Providers page to add a provider config with your GEMINI_API_KEY env var.");
    } catch (err) {
      setError("❌ Could not connect to AI backend. Make sure the API server is running.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen" style={{ background: "#0a0614" }}>
      {/* Agent List */}
      <div className="w-52 shrink-0 py-4 px-2 overflow-y-auto" style={{ background: "#0d0920", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-purple-500/50 px-2 py-2">10 Agents</div>
        {["Core", "Research", "Creation", "Analytics"].map(cat => (
          <div key={cat} className="mb-3">
            <div className="text-[9px] font-bold uppercase text-purple-500/40 px-2 py-1">{cat}</div>
            {prompts.filter(p => p.category === cat).map(p => (
              <button key={p.id} onClick={() => { setSelected(p.id); setDraft(p.prompt); setEditing(false); }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium mb-0.5 transition-all ${selected === p.id ? "gradient-purple text-white" : "text-purple-300/70 hover:bg-purple-900/30"}`}>
                <span>{p.icon}</span>
                <span className="flex-1 text-left">{p.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{prompt.icon}</span>
            <div>
              <h1 className="text-lg font-bold text-white">{prompt.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>{prompt.category}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => { setDraft(prompt.prompt); setEditing(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs text-purple-300 border border-purple-500/30">Cancel</button>
                <button onClick={save}
                  className="px-4 py-1.5 rounded-lg text-xs text-white gradient-purple">💾 Save</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="px-4 py-1.5 rounded-lg text-xs text-white gradient-purple">✏️ Edit Prompt</button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-purple-400 mb-2 block">System Prompt</label>
          <textarea
            value={editing ? draft : prompt.prompt}
            onChange={e => setDraft(e.target.value)}
            readOnly={!editing} rows={8}
            className={`w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none font-mono leading-relaxed ${!editing ? "opacity-80" : ""}`}
            style={{ background: "#0d0920", border: `1px solid ${editing ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.15)"}` }} />
        </div>

        {/* Test Runner */}
        <div className="card-os p-4">
          <h3 className="text-xs font-bold text-purple-300 mb-3">🧪 Test Runner</h3>
          <textarea value={testInput} onChange={e => setTestInput(e.target.value)}
            placeholder="Enter test input..." rows={2}
            className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none resize-none mb-3"
            style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.2)" }} />
          <button onClick={runTest} disabled={testing || !testInput.trim()}
            className="px-5 py-2 rounded-lg text-xs text-white gradient-purple disabled:opacity-50 mb-3">
            {testing ? "⟳ Running..." : "▶ Run Test"}
          </button>
          {testOutput && (
            <pre className="text-xs text-purple-300 font-mono whitespace-pre-wrap p-3 rounded-lg"
              style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.1)" }}>
              {testOutput}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
