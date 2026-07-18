import "dotenv/config";
import { TTSService, VideoService } from "../lib/video-renderer/dist/index.js";
import { TikTokPublisher, YouTubePublisher } from "../lib/social-publisher/dist/index.js";

async function runLiveCampaign() {
  console.log("====================================================================");
  console.log("🐙 OCTOPUS OS - LIVE REAL CAMPAIGN EXECUTION TEST (بدون محاكاة)");
  console.log("====================================================================");

  console.log("\n[🔍 0] Checking Loaded Environment Credentials:");
  console.log(" - ELEVENLABS_API_KEY: ", process.env.ELEVENLABS_API_KEY ? `✅ Armed (${process.env.ELEVENLABS_API_KEY.slice(0, 10)}...)` : "❌ Missing");
  console.log(" - HEYGEN_API_KEY:     ", process.env.HEYGEN_API_KEY ? `✅ Armed (${process.env.HEYGEN_API_KEY.slice(0, 10)}...)` : "❌ Missing");
  console.log(" - YOUTUBE_CLIENT_ID:  ", process.env.YOUTUBE_CLIENT_ID ? `✅ Armed (${process.env.YOUTUBE_CLIENT_ID.slice(0, 15)}...)` : "❌ Missing");
  console.log(" - TIKTOK_CLIENT_KEY:  ", process.env.TIKTOK_CLIENT_KEY ? `✅ Armed (${process.env.TIKTOK_CLIENT_KEY.slice(0, 8)}...)` : "❌ Missing");

  const ttsService = new TTSService();
  const videoService = new VideoService();
  const tiktokPublisher = new TikTokPublisher();
  const youtubePublisher = new YouTubePublisher();

  const script = "اكتشف أحدث منتجات الذكاء الاصطناعي مع نظام OCTOPUS OS الحصري لأتمتة التسويق والربح من الأفلييت دون تدخل بشري! انضم الآن.";
  console.log("\n--------------------------------------------------------------------");
  console.log("📝 [Step 1] Campaign Script Ready:");
  console.log(` "${script}"`);
  console.log("--------------------------------------------------------------------");

  // Step 2: ElevenLabs TTS
  console.log("\n🎙️ [Step 2] Executing Real ElevenLabs TTS API Call...");
  const ttsResult = await ttsService.generateVoiceover({
    script,
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel / Multilingual
    modelId: "eleven_multilingual_v2"
  });

  if (ttsResult.status === "completed") {
    console.log(` ✅ ElevenLabs Audio Generated Successfully! Audio ID: ${ttsResult.audioId}`);
    console.log(` 💾 Base64 Audio Length: ${ttsResult.audioBufferBase64?.length ?? 0} bytes`);
  } else {
    console.log(` ⚠️ ElevenLabs Response: Status=${ttsResult.status}, Error: ${ttsResult.error}`);
  }

  // Step 3: HeyGen Video Generation
  console.log("\n🎬 [Step 3] Executing Real HeyGen Video Generation API Call...");
  const videoResult = await videoService.renderVideo({
    script,
    aspectRatio: "9:16",
    title: "OCTOPUS AI Live Campaign Test"
  });

  if (videoResult.status === "processing" || videoResult.status === "completed") {
    console.log(` ✅ HeyGen Video Generation Initiated Successfully! Video ID: ${videoResult.videoId}`);
    console.log(` ⏳ Status: ${videoResult.status} (Video generation is processing asynchronously on HeyGen servers)`);
  } else {
    console.log(` ⚠️ HeyGen Response: Status=${videoResult.status}, Error: ${videoResult.error}`);
  }

  // Step 4: TikTok Publishing API Check
  console.log("\n🎵 [Step 4] Executing Real TikTok Publishing Init API Call...");
  const tiktokResult = await tiktokPublisher.publish({
    title: "OCTOPUS AI Live Campaign Test #AI #Affiliate",
    videoUrl: "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.mp4" // sample mp4 URL for init test
  });
  console.log(` 📡 TikTok Publisher Response: Status=${tiktokResult.status}, Error/ID=${tiktokResult.error || tiktokResult.platformPostId || "N/A"}`);

  // Step 5: YouTube Publishing API Check
  console.log("\n📺 [Step 5] Executing Real YouTube Shorts Publishing API Call...");
  const youtubeResult = await youtubePublisher.publish({
    title: "OCTOPUS AI Live Campaign Test #Shorts",
    description: "Automated affiliate marketing campaign powered by OCTOPUS OS.",
    videoUrl: "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.mp4"
  });
  console.log(` 📡 YouTube Publisher Response: Status=${youtubeResult.status}, Error/ID=${youtubeResult.error || youtubeResult.platformPostId || "N/A"}`);

  console.log("\n====================================================================");
  console.log("🏁 Live Campaign Execution Check Complete!");
  console.log("====================================================================");
}

runLiveCampaign().catch(console.error);
