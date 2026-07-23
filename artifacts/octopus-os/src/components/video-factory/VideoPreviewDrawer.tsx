import React from "react";
import type { VideoJob } from "../../hooks/useVideoProduction";
import { STATUS_CONFIG } from "./ProductionQueue";

interface VideoPreviewDrawerProps {
  previewJob: VideoJob;
  setPreviewJob: (job: VideoJob | null) => void;
  fetchJobs: () => void;
}

export function VideoPreviewDrawer({ previewJob, setPreviewJob, fetchJobs }: VideoPreviewDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#120d26] border border-purple-800/40 rounded-2xl p-6 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <button
          onClick={() => setPreviewJob(null)}
          className="absolute top-4 right-4 text-purple-400 hover:text-white text-lg font-bold z-30"
        >
          ✕ Close
        </button>

        <div className="flex justify-center items-center">
          <div className="w-[280px] h-[500px] border-4 border-gray-800 rounded-[36px] overflow-hidden relative bg-black shadow-2xl shadow-purple-900/40 flex flex-col">
            <div className="w-24 h-4 bg-gray-800 rounded-full mx-auto mt-2 absolute top-0 left-1/2 -translate-x-1/2 z-20" />
            
            <div className="w-full h-full relative flex flex-col justify-between">
              {previewJob.videoUrl ? (
                <video
                  src={previewJob.videoUrl}
                  controls
                  autoPlay
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[#0a0614] flex flex-col items-center justify-center p-4 text-center">
                  <div className="text-4xl mb-3 animate-pulse">🎬</div>
                  <p className="text-xs font-bold text-white mb-1">{STATUS_CONFIG[previewJob.status]?.label || previewJob.status}</p>
                  <p className="text-[10px] text-purple-400">
                    {previewJob.status === "rendering_video"
                      ? "HeyGen AI is actively rendering this video on remote servers right now. Polling every 6s..."
                      : previewJob.errorMessage || "Waiting for render output..."}
                  </p>
                </div>
              )}

              {!previewJob.videoUrl && (
                <div className="z-10 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col gap-2 mt-auto">
                  <p className="text-[11px] font-bold text-white">{previewJob.productName}</p>
                  <p className="text-[10px] text-white/90 leading-relaxed font-mono">
                    {previewJob.hook}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black text-white mb-2">🎬 Real Production Asset Details</h2>
            <p className="text-xs text-purple-400 mb-4">
              Persistent video job stored in PostgreSQL (`video_jobs`). Connected directly to HeyGen & ElevenLabs.
            </p>

            <div className="space-y-3.5 mb-6">
              <div>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Job ID (PostgreSQL)</p>
                <p className="text-xs text-white bg-[#0d0920] p-2.5 rounded-lg border border-purple-900/30 font-mono">{previewJob.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Hook / Script Line</p>
                <p className="text-xs text-white bg-[#0d0920] p-2.5 rounded-lg border border-purple-900/30 font-mono max-h-24 overflow-y-auto">{previewJob.script || previewJob.hook}</p>
              </div>
              <div>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Target Platform</p>
                <p className="text-xs text-white bg-[#0d0920] p-2.5 rounded-lg border border-purple-900/30 font-mono">{previewJob.platform}</p>
              </div>
              <div>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">🎨 Video Style & Format</p>
                <p className="text-xs text-indigo-300 bg-[#0d0920] p-2.5 rounded-lg border border-indigo-900/40 font-mono font-bold">{previewJob.template || "Standard Presentation"}</p>
              </div>
              <div>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">🎭 Character & Voice Setup</p>
                <p className="text-xs text-purple-300 bg-[#0d0920] p-2.5 rounded-lg border border-purple-900/40 font-mono font-bold">{previewJob.voice || "Abigail (Studio Avatar)"}</p>
              </div>
              <div>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Status & Error Details</p>
                <div className="bg-[#0d0920] p-2.5 rounded-lg border border-purple-900/30 font-mono text-xs">
                  <span className="font-bold text-white">{previewJob.status.toUpperCase()}</span>
                  {previewJob.errorMessage && (
                    <p className="text-red-400 text-[10px] mt-1">{previewJob.errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {previewJob.videoUrl && (
              <a 
                href={previewJob.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 rounded-xl transition-all text-center text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5"
              >
                ⬇️ Download MP4 Directly from HeyGen CDN
              </a>
            )}
            {previewJob.publishedUrl && (
              <a 
                href={previewJob.publishedUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full bg-red-700/80 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all text-center text-xs border border-red-500/30 flex items-center justify-center gap-1.5"
              >
                📺 Watch Live on YouTube Shorts
              </a>
            )}
            <button 
              onClick={() => fetchJobs()}
              className="w-full bg-[#1b123a] hover:bg-purple-900/30 text-purple-300 font-bold py-2.5 rounded-xl text-xs border border-purple-800/40 transition-all"
            >
              🔄 Check Status Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
