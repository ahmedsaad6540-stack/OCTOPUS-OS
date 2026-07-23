import React, { useState } from "react";
import { useVideoProduction, type VideoJob } from "../hooks/useVideoProduction";
import { BatchSettingsPanel, PLATFORMS_LIST } from "../components/video-factory/BatchSettingsPanel";
import { ProductionTelemetry } from "../components/video-factory/ProductionTelemetry";
import { ProductionQueue } from "../components/video-factory/ProductionQueue";
import { VideoPreviewDrawer } from "../components/video-factory/VideoPreviewDrawer";

export function VideoFactoryPage() {
  const [product, setProduct] = useState("Genius Wave & Wealth Manifestation");
  const [platform, setPlatform] = useState(PLATFORMS_LIST[0]);
  const [variationMode, setVariationMode] = useState("Full Variation (Hook + Voice + Music)");
  const [videoStyle, setVideoStyle] = useState("auto_rotate");
  const [avatarCharacter, setAvatarCharacter] = useState("auto_rotate");
  const [videoEngine, setVideoEngine] = useState("auto_dynamic");
  const [count, setCount] = useState(1);
  const [previewJob, setPreviewJob] = useState<VideoJob | null>(null);

  const {
    jobs,
    running,
    refreshing,
    statusMsg,
    showMsg,
    generate,
    refreshLiveStatus,
    deleteJob,
    clearAllJobs,
    fetchJobs,
  } = useVideoProduction();

  const handleGenerate = () => {
    generate({
      productName: product,
      platform,
      count,
      variationMode,
      videoStyle,
      avatarCharacter,
      videoEngine
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">🎬 Multi-Style AI Video Factory</h1>
          <p className="text-purple-400 text-sm mt-1">
            Produce rich 3D animated cartoons, product zoom demos, and diverse human avatars at scale on HeyGen & ElevenLabs.
          </p>
        </div>

        {statusMsg && (
          <div className="mb-4 bg-purple-900/40 text-purple-200 p-3 rounded-xl border border-purple-800/50 text-sm font-medium animate-pulse">
            {statusMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <BatchSettingsPanel
            product={product} setProduct={setProduct}
            platform={platform} setPlatform={setPlatform}
            videoEngine={videoEngine} setVideoEngine={setVideoEngine}
            videoStyle={videoStyle} setVideoStyle={setVideoStyle}
            avatarCharacter={avatarCharacter} setAvatarCharacter={setAvatarCharacter}
            count={count} setCount={setCount}
            variationMode={variationMode} setVariationMode={setVariationMode}
            onGenerate={handleGenerate}
            running={running}
          />

          <ProductionTelemetry 
            jobs={jobs}
            refreshLiveStatus={refreshLiveStatus}
            clearAllJobs={clearAllJobs}
            refreshing={refreshing}
          />
        </div>

        <ProductionQueue 
          jobs={jobs}
          setPreviewJob={setPreviewJob}
          deleteJob={deleteJob}
          showMsg={showMsg}
        />

        {previewJob && (
          <VideoPreviewDrawer 
            previewJob={previewJob}
            setPreviewJob={setPreviewJob}
            fetchJobs={fetchJobs}
          />
        )}
      </div>
    </div>
  );
}
