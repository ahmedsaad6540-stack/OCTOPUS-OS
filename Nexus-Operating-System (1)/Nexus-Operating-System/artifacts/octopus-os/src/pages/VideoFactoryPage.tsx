import { useState } from "react";

const BATCHES = [5, 10, 25, 50, 100, 500];
const VOICES = ["David (US Male)", "Sarah (US Female)", "James (UK Male)", "Emma (UK Female)", "Carlos (Spanish)"];
const HOOKS = ["Shocking fact", "Question hook", "Story hook", "Listicle hook", "Controversy hook"];
const CTAS = ["Link in bio", "Buy now", "Swipe up", "Comment below", "DM me"];

export function VideoFactoryPage() {
  const [batch, setBatch] = useState(10);
  const [voice, setVoice] = useState(VOICES[0]);
  const [hook, setHook] = useState(HOOKS[0]);
  const [cta, setCta] = useState(CTAS[0]);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(0);
  const [videos, setVideos] = useState<{ id: number; title: string; duration: string; status: string }[]>([]);

  const generate = async () => {
    if (!topic) return;
    setGenerating(true); setProgress(0); setGenerated(0);
    setVideos([]);
    for (let i = 0; i < batch; i++) {
      await new Promise(r => setTimeout(r, 120 + Math.random() * 80));
      setProgress(Math.round(((i + 1) / batch) * 100));
      setGenerated(i + 1);
      setVideos(v => [...v, {
        id: i + 1,
        title: `${topic} — Variation #${i + 1}`,
        duration: `${30 + Math.floor(Math.random() * 30)}s`,
        status: "ready",
      }]);
    }
    setGenerating(false);
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🎬 Video Factory</h1>
        <p className="text-purple-400/60 text-xs mt-1">Mass-produce unique videos at scale — up to 500 at once</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Config */}
        <div className="col-span-1 space-y-4">
          <div className="card-os p-4">
            <h3 className="text-xs font-bold text-purple-300 mb-4">📋 Production Config</h3>

            <div className="mb-3">
              <label className="text-xs text-purple-400 mb-2 block">Topic / Product</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Weight loss supplement..."
                className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none"
                style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.2)" }} />
            </div>

            <div className="mb-3">
              <label className="text-xs text-purple-400 mb-2 block">Batch Size</label>
              <div className="grid grid-cols-3 gap-1">
                {BATCHES.map(b => (
                  <button key={b} onClick={() => setBatch(b)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${batch === b ? "gradient-purple text-white" : "text-purple-400 hover:bg-purple-900/30"}`}
                    style={batch !== b ? { background: "#0a0614", border: "1px solid rgba(139,92,246,0.15)" } : {}}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {[["🎤 Voice", VOICES, voice, setVoice], ["🪝 Hook Style", HOOKS, hook, setHook], ["📢 CTA", CTAS, cta, setCta]].map(([label, opts, val, setter]: any) => (
              <div key={label} className="mb-3">
                <label className="text-xs text-purple-400 mb-1 block">{label}</label>
                <select value={val} onChange={e => setter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none"
                  style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.2)" }}>
                  {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <div className="mb-3">
              <label className="text-xs text-purple-400 mb-2 block">Options</label>
              {[["🖼️ Auto-generate images", true], ["💬 Add subtitles", true], ["🎵 Background music", false]].map(([label, def]: any) => (
                <label key={label} className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" defaultChecked={def} className="accent-purple-600" />
                  <span className="text-xs text-purple-300">{label}</span>
                </label>
              ))}
            </div>

            <button onClick={generate} disabled={generating || !topic}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white gradient-purple glow-purple disabled:opacity-50 transition-all">
              {generating ? `⟳ Generating ${generated}/${batch}...` : `⚡ Generate ${batch} Videos`}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="col-span-2">
          {generating && (
            <div className="card-os p-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">🎬 Generating Videos...</span>
                <span className="text-sm font-bold text-purple-300">{generated}/{batch}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "rgba(139,92,246,0.15)" }}>
                <div className="h-full rounded-full gradient-purple transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="text-xs text-purple-400/60">{progress}% complete — Each video is unique</div>
            </div>
          )}

          {videos.length > 0 && (
            <div className="card-os p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">✅ Generated Videos ({videos.length})</h3>
                <button className="px-3 py-1.5 rounded-lg text-xs text-purple-300 border border-purple-500/30">⬇️ Download All</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {videos.map(v => (
                  <div key={v.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "#0a0614" }}>
                    <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center text-sm shrink-0">🎬</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{v.title}</div>
                      <div className="text-[10px] text-purple-400/60">{v.duration}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400">Ready</span>
                    <button className="text-purple-400 hover:text-purple-300 text-xs">⬇️</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!generating && videos.length === 0 && (
            <div className="card-os p-12 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">🎬</div>
              <h3 className="text-lg font-bold text-white mb-2">Ready to Mass-Produce</h3>
              <p className="text-xs text-purple-400/60 max-w-xs">Configure your topic, voice, and style on the left — then generate hundreds of unique videos at once.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
