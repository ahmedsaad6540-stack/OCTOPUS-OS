import React from "react";
import type { VideoJob } from "../../hooks/useVideoProduction";

export const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  queued: { color: "text-gray-400", bg: "bg-gray-900/20 border-gray-800/30", label: "Queued" },
  generating_voice: { color: "text-purple-400", bg: "bg-purple-900/20 border-purple-800/40", label: "Generating Voice" },
  rendering_video: { color: "text-amber-400", bg: "bg-amber-900/20 border-amber-800/40", label: "Rendering Video (HeyGen)" },
  done: { color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/40", label: "Rendered & Ready" },
  failed: { color: "text-red-400", bg: "bg-red-900/20 border-red-800/40", label: "Failed" },
};

interface ProductionQueueProps {
  jobs: VideoJob[];
  setPreviewJob: (job: VideoJob) => void;
  deleteJob: (id: string) => void;
  showMsg: (msg: string) => void;
}

export function ProductionQueue({ jobs, setPreviewJob, deleteJob, showMsg }: ProductionQueueProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-8 text-center">
        <p className="text-sm font-bold text-white mb-1">No Video Production Jobs Found</p>
        <p className="text-xs text-purple-400">Enter a product name above and click "Launch Real Production Batch" to start rendering on HeyGen servers.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            Live Production Queue (PostgreSQL)
            <button 
              onClick={() => showMsg("تم تبديل حالة محرك الريندرينج (Live Production Engine).")}
              className="ml-3 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-bold rounded shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1"
              title="تشغيل / إيقاف محرك الإنتاج"
            >
              <span>▶️/⏸️</span> إيقاف / تشغيل محرك الريندرينج
            </button>
          </h2>
        </div>
        <span className="text-xs text-purple-500">{jobs.length} total records</span>
      </div>
      <div className="divide-y divide-purple-900/20 max-h-96 overflow-y-auto">
        {jobs.map((job, i) => {
          const s = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
          return (
            <div key={job.id} className="flex items-center gap-4 px-4 py-3 hover:bg-purple-900/10 transition-colors">
              <span className="text-[10px] font-mono text-purple-700 w-6">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate font-medium">{job.hook}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-purple-400">{job.productName}</span>
                  <span className="text-[9px] text-purple-700">·</span>
                  <span className="text-[9px] text-purple-600">{job.platform}</span>
                  <span className="text-[9px] text-purple-700">·</span>
                  <span className="text-[9px] text-purple-600">{job.duration || "25s"}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 px-2 py-0.5 rounded-md font-medium">
                    🎨 {job.template || "Standard Presentation"}
                  </span>
                  <span className="text-[9px] bg-purple-900/40 border border-purple-700/50 text-purple-300 px-2 py-0.5 rounded-md font-medium">
                    🎭 {job.voice || "Abigail (Studio Avatar)"}
                  </span>
                </div>
                {job.errorMessage && (
                  <p className="text-[10px] text-red-400 mt-1 truncate">⚠️ {job.errorMessage}</p>
                )}
              </div>
              {job.status === "rendering_video" || job.status === "generating_voice" ? (
                <div className="w-24">
                  <div className="w-full bg-[#0d0920] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-amber-500 transition-all animate-pulse" style={{ width: `${job.progress || 50}%` }} />
                  </div>
                  <p className="text-[9px] text-amber-400 text-center mt-0.5">{s.label}</p>
                </div>
              ) : (
                <span className={`text-[10px] px-2.5 py-1 rounded-full border ${s.bg} ${s.color} font-mono`}>
                  {s.label}
                </span>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPreviewJob(job)}
                  className="text-[10px] text-purple-300 hover:text-white bg-purple-900/30 px-2.5 py-1 rounded border border-purple-800/40 transition-all"
                >
                  👁️ View Details & Video
                </button>
                {job.videoUrl && (
                  <>
                    <a
                      href={job.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-300 hover:text-white bg-emerald-900/30 px-2.5 py-1 rounded border border-emerald-800/40 transition-all flex items-center gap-1"
                    >
                      ⬇️ MP4
                    </a>
                    <button
                      onClick={() => {
                        const cleanTag = (job.productName || "AI").replace(/[^a-zA-Z0-9]/g, "");
                        const caption = `${job.hook || ""}\n\n${job.script || ""}\n\n#FYP #Viral #TikTokMadeMeBuyIt #AI #${cleanTag}`;
                        navigator.clipboard.writeText(caption);
                        alert("📋 [تم نسخ الوصف والهاشتاجات لحافظتك بنجاح!]\n\nسيتم الآن فتح استوديو رفع تيك توك لحسابك @www.tiktokoctopuslab.\n\nفقط قم بوضع ملف الفيديو المرفق والصق الوصف (Paste) واضغط Post ليكون لايف في ثوانٍ! 🚀");
                        window.open(job.videoUrl!, "_blank");
                        window.open("https://www.tiktok.com/creator#/upload?lang=ar", "_blank");
                      }}
                      className="text-[10px] text-pink-300 hover:text-white bg-gradient-to-r from-pink-900/40 to-purple-900/40 px-2.5 py-1 rounded border border-pink-700/50 transition-all font-bold flex items-center gap-1 glow-purple"
                    >
                      📱 نشر في تيك توك (@www.tiktokoctopuslab)
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteJob(job.id)}
                  className="text-[10px] text-red-400 hover:text-white bg-red-900/20 hover:bg-red-900/50 px-2.5 py-1 rounded border border-red-800/30 transition-all flex items-center gap-1"
                  title="حذف هذا الفيديو من السجل"
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
