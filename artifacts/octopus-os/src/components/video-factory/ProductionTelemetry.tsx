import React from "react";
import type { VideoJob } from "../../hooks/useVideoProduction";

interface ProductionTelemetryProps {
  jobs: VideoJob[];
  refreshLiveStatus: () => void;
  clearAllJobs: () => void;
  refreshing: boolean;
}

export function ProductionTelemetry({ jobs, refreshLiveStatus, clearAllJobs, refreshing }: ProductionTelemetryProps) {
  const doneCount = jobs.filter((j) => j.status === "done").length;
  const activeCount = jobs.filter((j) => j.status === "rendering_video" || j.status === "generating_voice").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  const downloadAll = () => {
    const completedJobs = jobs.filter((j) => j.status === "done" && j.videoUrl);
    if (completedJobs.length === 0) {
      alert("لا يوجد فيديوهات مكتملة الرندر للتحميل حالياً");
      return;
    }

    let fileContent = `🐙 OCTOPUS NEXUS OS — Real Production Video Manifest\n`;
    fileContent += `Generated At: ${new Date().toLocaleString()}\n`;
    fileContent += `==========================================\n\n`;

    completedJobs.forEach((job, idx) => {
      fileContent += `🎬 VIDEO #${idx + 1} (ID: ${job.id})\n`;
      fileContent += `Product: ${job.productName}\n`;
      fileContent += `Platform: ${job.platform}\n`;
      fileContent += `Style: ${job.template || "Standard"}\n`;
      fileContent += `Character/Voice: ${job.voice || "Abigail"}\n`;
      fileContent += `HeyGen MP4 URL: ${job.videoUrl || "N/A"}\n`;
      fileContent += `Published URL: ${job.publishedUrl || "Not yet published"}\n`;
      fileContent += `Hook: ${job.hook}\n`;
      fileContent += `Script:\n${job.script}\n`;
      fileContent += `==========================================\n\n`;
    });

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `octopus_production_manifest_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-bold text-purple-300 mb-3">📊 Real Production Telemetry</h2>
        <div className="space-y-3">
          <div className="bg-[#0d0920] rounded-xl p-3.5 border border-purple-900/20 flex items-center justify-between">
            <span className="text-xs text-purple-400">Total Persistent Jobs</span>
            <span className="text-base font-black text-white">{jobs.length}</span>
          </div>
          <div className="bg-[#0d0920] rounded-xl p-3.5 border border-purple-900/20 flex items-center justify-between">
            <span className="text-xs text-emerald-400">Rendered & Ready</span>
            <span className="text-base font-black text-emerald-400">{doneCount}</span>
          </div>
          <div className="bg-[#0d0920] rounded-xl p-3.5 border border-purple-900/20 flex items-center justify-between">
            <span className="text-xs text-amber-400">Rendering on HeyGen</span>
            <span className="text-base font-black text-amber-400">{activeCount}</span>
          </div>
          <div className="bg-[#0d0920] rounded-xl p-3.5 border border-purple-900/20 flex items-center justify-between">
            <span className="text-xs text-red-400">Failed / Errors</span>
            <span className="text-base font-black text-red-400">{failedCount}</span>
          </div>
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-900/30">
          <div className="flex items-center justify-between text-xs text-purple-400 mb-1.5">
            <span>Overall Render Rate</span>
            <span className="font-bold text-white">{jobs.length > 0 ? Math.round((doneCount / jobs.length) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-[#0d0920] rounded-full h-2">
            <div className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all" style={{ width: `${jobs.length > 0 ? (doneCount / jobs.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      {doneCount > 0 && (
        <button 
          onClick={downloadAll}
          className="w-full mt-4 bg-emerald-800/40 hover:bg-emerald-700/60 text-emerald-300 font-bold py-2.5 rounded-xl text-xs border border-emerald-800/40 transition-all"
        >
          📥 Download Production Manifest & MP4 Links
        </button>
      )}
      <div className="flex gap-2 mt-2">
        <button 
          onClick={refreshLiveStatus}
          disabled={refreshing}
          className="flex-1 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 font-semibold py-2 rounded-xl text-xs border border-purple-800/30 transition-all flex items-center justify-center gap-1.5"
        >
          <span>{refreshing ? "⏳" : "🔄"}</span> <span>{refreshing ? "جاري التحديث..." : "Refresh Live Status"}</span>
        </button>
        {jobs.length > 0 && (
          <button 
            onClick={clearAllJobs}
            className="px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-semibold py-2 rounded-xl text-xs border border-red-800/40 transition-all flex items-center justify-center gap-1"
            title="تفريغ كافة الفيديوهات والمحتوى المصنوع"
          >
            <span>🗑️</span> <span>تفريغ الكل</span>
          </button>
        )}
      </div>
    </div>
  );
}
