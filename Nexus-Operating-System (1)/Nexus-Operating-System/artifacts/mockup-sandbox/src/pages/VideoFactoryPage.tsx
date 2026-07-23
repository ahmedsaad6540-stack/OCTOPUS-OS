import { useState } from "react";

interface VideoJob {
  id: string;
  hook: string;
  voice: string;
  template: string;
  music: string;
  duration: string;
  status: "queued" | "generating" | "done" | "failed";
  progress: number;
  platform: string;
}

const VOICES = ["Ryan (ElevenLabs)", "Sara (ElevenLabs)", "Josh (ElevenLabs)", "Edge TTS - US Male", "Edge TTS - UK Female", "Edge TTS - Arabic"];
const TEMPLATES = ["Hook → Demo → Proof → CTA", "Problem → Agitate → Solution", "Story → Transformation → CTA", "Shock Fact → Curiosity → Reveal", "Before/After → Social Proof → CTA"];
const HOOKS = [
  "POV: You found the product I've been hiding...",
  "They said this was too expensive until they saw THIS",
  "3 seconds or I lose you forever — watch this",
  "I spent $500 testing this so you don't have to",
  "This is the reason I quit my job...",
  "Stop scrolling — this actually changed my life",
  "The product that made me $10k last month",
  "Nobody talks about this affiliate secret",
];
const PLATFORMS_LIST = ["TikTok", "YouTube Shorts", "Instagram Reels", "Pinterest"];
const MUSIC_OPTIONS = ["No Music", "Trending Beat (TikTok)", "Upbeat Pop", "Emotional Piano", "Hip Hop Bass", "Custom Upload"];

function randChoice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randId() { return Math.random().toString(36).slice(2, 8); }

function generateJobs(count: number): VideoJob[] {
  return Array.from({ length: count }, (_, i) => ({
    id: randId(),
    hook: HOOKS[i % HOOKS.length],
    voice: randChoice(VOICES),
    template: randChoice(TEMPLATES),
    music: randChoice(MUSIC_OPTIONS),
    duration: `${18 + Math.floor(Math.random() * 8)}s`,
    status: "queued" as const,
    progress: 0,
    platform: randChoice(PLATFORMS_LIST),
  }));
}

const STATUS_CONFIG = {
  queued: { color: "text-gray-400", bg: "bg-gray-900/20 border-gray-800/30", label: "Queued" },
  generating: { color: "text-amber-400", bg: "bg-amber-900/20 border-amber-800/40", label: "Generating" },
  done: { color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/40", label: "Done" },
  failed: { color: "text-red-400", bg: "bg-red-900/20 border-red-800/40", label: "Failed" },
};

export function VideoFactoryPage() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [count, setCount] = useState(10);
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [running, setRunning] = useState(false);

  const generate = async () => {
    if (!product.trim()) return;
    setRunning(true);
    const newJobs = generateJobs(count);
    setJobs(newJobs);

    for (let i = 0; i < newJobs.length; i++) {
      await new Promise((r) => setTimeout(r, 300));
      setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, status: "generating", progress: 0 } : j));

      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 150));
        setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, progress: p } : j));
      }

      await new Promise((r) => setTimeout(r, 200));
      setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, status: "done", progress: 100 } : j));
    }
    setRunning(false);
  };

  const done = jobs.filter((j) => j.status === "done").length;
  const generating = jobs.filter((j) => j.status === "generating").length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">🎬 Video Factory</h1>
          <p className="text-purple-400 text-sm mt-1">
            Generate 100 unique videos in one batch. Different hook, voice, music, and template per video.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2 bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <h2 className="text-sm font-bold text-purple-300 mb-4">⚙️ Factory Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">Product Name</label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Wireless Earbuds Pro X200"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">Target Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                  {PLATFORMS_LIST.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">Number of Videos</label>
                <div className="flex gap-2">
                  {[5, 10, 25, 50, 100].map((n) => (
                    <button key={n} onClick={() => setCount(n)} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${count === n ? "bg-purple-700 text-white border-purple-600" : "bg-[#0d0920] text-purple-400 border-purple-800/30 hover:border-purple-600"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">Variation Mode</label>
                <select className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                  <option>Full Variation (Hook + Voice + Music)</option>
                  <option>Hook Only</option>
                  <option>Voice Only</option>
                  <option>Template Only</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Hooks Library", items: HOOKS.length, icon: "🪝" },
                { label: "Voice Options", items: VOICES.length, icon: "🎙️" },
                { label: "Templates", items: TEMPLATES.length, icon: "🎨" },
              ].map(({ label, items, icon }) => (
                <div key={label} className="bg-[#0d0920] rounded-xl p-3 border border-purple-900/20 text-center">
                  <p className="text-xl mb-1">{icon}</p>
                  <p className="text-sm font-bold text-white">{items}</p>
                  <p className="text-[10px] text-purple-500">{label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => void generate()}
              disabled={running || !product.trim()}
              className="w-full mt-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {running ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Generating {done}/{count} videos...
                </>
              ) : `🎬 Generate ${count} Videos`}
            </button>
          </div>

          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <h2 className="text-sm font-bold text-purple-300 mb-4">📊 Factory Status</h2>
            <div className="space-y-3">
              {[
                { label: "Total Jobs", value: jobs.length || count, color: "text-white" },
                { label: "Completed", value: done, color: "text-emerald-400" },
                { label: "In Progress", value: generating, color: "text-amber-400" },
                { label: "Queued", value: jobs.filter(j => j.status === "queued").length || 0, color: "text-gray-400" },
                { label: "Failed", value: jobs.filter(j => j.status === "failed").length || 0, color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-purple-400">{label}</span>
                  <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
                </div>
              ))}
            </div>
            {jobs.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-purple-500 mb-1">
                  <span>Overall Progress</span>
                  <span>{Math.round((done / jobs.length) * 100)}%</span>
                </div>
                <div className="w-full bg-[#0d0920] rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all" style={{ width: `${(done / jobs.length) * 100}%` }} />
                </div>
              </div>
            )}
            {done > 0 && (
              <button className="w-full mt-4 bg-emerald-800/40 hover:bg-emerald-700/60 text-emerald-300 font-bold py-2.5 rounded-xl text-xs border border-emerald-800/40 transition-all">
                ⬇️ Download All ({done}) Videos
              </button>
            )}
          </div>
        </div>

        {jobs.length > 0 && (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Video Queue</h2>
              <span className="text-xs text-purple-500">{jobs.length} jobs</span>
            </div>
            <div className="divide-y divide-purple-900/20 max-h-96 overflow-y-auto">
              {jobs.map((job, i) => {
                const s = STATUS_CONFIG[job.status];
                return (
                  <div key={job.id} className="flex items-center gap-4 px-4 py-3 hover:bg-purple-900/10 transition-colors">
                    <span className="text-[10px] font-mono text-purple-700 w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{job.hook}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-purple-600">{job.voice}</span>
                        <span className="text-[9px] text-purple-700">·</span>
                        <span className="text-[9px] text-purple-600">{job.duration}</span>
                        <span className="text-[9px] text-purple-700">·</span>
                        <span className="text-[9px] text-purple-600">{job.platform}</span>
                      </div>
                    </div>
                    {job.status === "generating" ? (
                      <div className="w-20">
                        <div className="w-full bg-[#0d0920] rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-amber-500 transition-all" style={{ width: `${job.progress}%` }} />
                        </div>
                        <p className="text-[9px] text-amber-400 text-center mt-0.5">{job.progress}%</p>
                      </div>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${s.bg} ${s.color} font-mono`}>
                        {s.label}
                      </span>
                    )}
                    {job.status === "done" && (
                      <button className="text-[10px] text-purple-400 hover:text-white bg-purple-900/20 px-2 py-1 rounded border border-purple-800/30 transition-all">↓</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
