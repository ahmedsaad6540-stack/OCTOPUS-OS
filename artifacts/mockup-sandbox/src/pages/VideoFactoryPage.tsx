import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface VideoJob {
  id: string;
  productName: string;
  hook: string;
  script: string;
  voice: string;
  template: string;
  music: string;
  duration: string;
  status: string; // queued, generating_voice, rendering_video, done, failed
  progress: number;
  platform: string;
  videoUrl?: string;
  publishedUrl?: string;
  errorMessage?: string;
  createdAt?: string;
}

const PLATFORMS_LIST = ["YouTube Shorts", "TikTok", "Instagram Reels", "Pinterest"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  queued: { color: "text-gray-400", bg: "bg-gray-900/20 border-gray-800/30", label: "Queued" },
  generating_voice: { color: "text-purple-400", bg: "bg-purple-900/20 border-purple-800/40", label: "Generating Voice" },
  rendering_video: { color: "text-amber-400", bg: "bg-amber-900/20 border-amber-800/40", label: "Rendering Video (HeyGen)" },
  done: { color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/40", label: "Rendered & Ready" },
  failed: { color: "text-red-400", bg: "bg-red-900/20 border-red-800/40", label: "Failed" },
};

export function VideoFactoryPage() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [count, setCount] = useState(1);
  const [product, setProduct] = useState("Genius Wave & Wealth Manifestation");
  const [platform, setPlatform] = useState("YouTube Shorts");
  const [variationMode, setVariationMode] = useState("Full Variation (Hook + Voice + Music)");
  const [videoStyle, setVideoStyle] = useState("auto_rotate");
  const [avatarCharacter, setAvatarCharacter] = useState("auto_rotate");
  const [videoEngine, setVideoEngine] = useState("auto_dynamic");
  const [running, setRunning] = useState(false);
  const [previewJob, setPreviewJob] = useState<VideoJob | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshLiveStatus = async () => {
    setRefreshing(true);
    try {
      const res = await api.get<{ success: boolean; jobs?: VideoJob[]; error?: string }>("/production/jobs?_t=" + Date.now());
      if (res.success && res.jobs) {
        setJobs(res.jobs);
        alert("✅ [تم تحديث حالة المهام من قاعدة البيانات وخادم HeyGen بنجاح]");
      } else {
        await fetchJobs();
      }
    } catch (e) {
      console.error("Refresh error:", e);
      alert("⚠️ تعذر الاتصال بالخادم أثناء التحديث");
    } finally {
      setRefreshing(false);
    }
  };

  const deleteJob = async (id?: string) => {
    if (!id || !confirm("هل أنت متأكد من حذف هذا الفيديو من قائمة المهام؟")) return;
    try {
      await api.delete("/production/jobs/" + id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e) {
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const clearAllJobs = async () => {
    if (!confirm("تحذير: هل تريد تفريغ وحذف جميع المهام والفيديوهات المصنوعة بالكامل من قاعدة البيانات؟")) return;
    try {
      await api.delete("/production/jobs");
      setJobs([]);
      alert("🗑️ تم تفريغ كافة سجلات وفيديوهات الإنتاج بنجاح.");
    } catch (e) {
      alert("حدث خطأ أثناء التفريغ");
    }
  };

  // Fetch real jobs from PostgreSQL when mounted & poll when active
  const fetchJobs = async () => {
    try {
      const res = await api.get<{ success: boolean; jobs?: VideoJob[]; error?: string }>("/production/jobs");
      if (res.success && res.jobs) {
        setJobs(res.jobs);
      }
    } catch (e) {
      console.error("Failed to fetch production jobs:", e);
    }
  };

  useEffect(() => {
    void fetchJobs();
    const interval = setInterval(() => {
      void fetchJobs();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const generate = async () => {
    if (!product.trim()) return;
    setRunning(true);
    try {
      const res = await api.post<{ success: boolean; jobs?: VideoJob[]; error?: string }>("/production/generate-video-batch", {
        productName: product,
        platform,
        count,
        variationMode,
        videoStyle,
        avatarCharacter,
        videoEngine
      });

      if (!res.success || !res.jobs) {
        alert("فشل طلب التوليد الحقيقي: " + (res.error || "خطأ من الخادم"));
        return;
      }

      alert(`⚡ [LAUNCH CONFIRMED - تم إطلاق دفعة الإنتاج بنجاح]\n\nتم إطلاق وتوليد عدد (${res.jobs.length}) فيديو بالذكاء الاصطناعي للمنتج "${product}".\n\nيجري الآن الرندر والمعالجة في الخلفية وستظهر المهام الجديدة أعلى القائمة فوراً!`);
      await fetchJobs();
    } catch (err: any) {
      alert("حدث خطأ أثناء الاتصال بخادم الإنتاج الحقيقي: " + (err?.message || String(err)));
    } finally {
      setRunning(false);
    }
  };

  const downloadAll = () => {
    const completedJobs = jobs.filter((j) => j.status === "done" && j.videoUrl);
    if (completedJobs.length === 0) {
      alert("لا يوجد فيديوهات حقيقية مكتملة الرندر للتحميل حالياً.");
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

  const doneCount = jobs.filter((j) => j.status === "done").length;
  const activeCount = jobs.filter((j) => j.status === "rendering_video" || j.status === "generating_voice").length;
  const queuedCount = jobs.filter((j) => j.status === "queued").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">🎬 Multi-Style AI Video Factory</h1>
          <p className="text-purple-400 text-sm mt-1">
            Produce rich 3D animated cartoons, product zoom demos, and diverse human avatars at scale on HeyGen & ElevenLabs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2 bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <h2 className="text-sm font-bold text-purple-300 mb-4">⚙️ Multi-Style Production Batch Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">Product Name / Offer</label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Genius Wave & Wealth Manifestation"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">Target Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                  {PLATFORMS_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-pink-400 mb-1.5">⚡ Engine / Provider Priority (مزود الفيديو ونظام التوليد الذكي)</label>
                <select value={videoEngine} onChange={(e) => setVideoEngine(e.target.value)} className="w-full bg-[#1b1238] border-2 border-pink-600/60 rounded-xl px-3 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-pink-400 glow-purple">
                  <option value="auto_dynamic">✨ الذكاء الاصطناعي التلقائي (يوجه كل منتج للمحرك والنمط الأمثل دون تكرار أو نمطية)</option>
                  <option value="gemini_veo">🤖 Google Gemini Veo / Cinematic 4K (عروض سينمائية وتكبيرات للمنتج 100% بدون متحدثين)</option>
                  <option value="runway_kling">🌪️ Runway Gen-3 / Kling AI (مقاطع حركية سريعة وتحولات لايف ستايل وحملات الفيرال)</option>
                  <option value="studio_ai">🎨 Studio AI + 3D Motion (رسوم كرتونية وثلاثية الأبعاد وشروحات إنفوجرافيك متحركة)</option>
                  <option value="heygen_v2">🎙️ HeyGen v2 (مقدمين وأشخاص متحدثين احترافيين - احتياطي وموزع على الشخصيات)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">🎨 Video Production Style / Format</label>
                <select value={videoStyle} onChange={(e) => setVideoStyle(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                  <option value="auto_rotate">🔄 تنويع وتدوير تلقائي (كافة الأنماط والشخصيات)</option>
                  <option value="animated_cartoon">🎨 رسوم متحركة وثلاثية الأبعاد (3D Cartoon & Motion Graphics)</option>
                  <option value="product_showcase">📦 عروض وتكبيرات للمنتج بدون شخصية متحدثة (Showcase Demos)</option>
                  <option value="avatar_presenter">🎭 مقدمين وأشخاص متنوعين بالذكاء الاصطناعي (Pro Avatars)</option>
                  <option value="cinematic_hybrid">🎬 دمج سينمائي بين الشاشة والمقدم (Hybrid B-Roll)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">🎭 Character / Avatar Selection</label>
                <select value={avatarCharacter} onChange={(e) => setAvatarCharacter(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                  <option value="auto_rotate">🔄 اختيار تلقائي وتوزيع على أسطول الشخصيات</option>
                  <option value="cartoon_leo">🦁 Leo — شخصية كرتونية ثلاثية الأبعاد 3D Animated Character</option>
                  <option value="cartoon_maya">✨ Maya — شخصية كرتونية وموجهة إنفوجرافيك Motion Guide</option>
                  <option value="david">⚡ David — مراجع تقني وحماسي Charismatic Tech Reviewer</option>
                  <option value="sarah">📸 Sarah — مؤثرة لايف ستايل وحيوية Casual Influencer</option>
                  <option value="marcus">👔 Marcus — خبير وموجه أعمال Authoritative Presenter</option>
                  <option value="abigail">🎬 Abigail — مقدمة ستوديو احترافية Studio Pro Presenter</option>
                  <option value="pure_showcase">📦 بدون شخصية (عرض المنتج والنصوص فقط B-Roll Only)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">Batch Count (Real Jobs)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 5].map((n) => (
                    <button key={n} onClick={() => setCount(n)} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${count === n ? "bg-purple-700 text-white border-purple-600" : "bg-[#0d0920] text-purple-400 border-purple-800/30 hover:border-purple-600"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">Variation Mode</label>
                <select value={variationMode} onChange={(e) => setVariationMode(e.target.value)} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500">
                  <option>Full Variation (Hook + Voice + Music)</option>
                  <option>Hook Only</option>
                  <option>Voice Only</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Active Engine", value: "HeyGen v2 + 3D Pro", icon: "🎬" },
                { label: "Voice Engine", value: "ElevenLabs + Studio AI", icon: "🎙️" },
                { label: "Storage", value: "PostgreSQL", icon: "🗄️" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-[#0d0920] rounded-xl p-3 border border-purple-900/20 text-center">
                  <p className="text-xl mb-1">{icon}</p>
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-[10px] text-purple-500">{label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => void generate()}
              disabled={running || !product.trim()}
              className="w-full mt-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-900/40"
            >
              {running ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Dispatching Real Jobs to HeyGen Servers...
                </>
              ) : `🎬 Launch Real Production Batch (${count} Videos)`}
            </button>
          </div>

          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <h2 className="text-sm font-bold text-purple-300 mb-4">📊 Live Database Engine Status</h2>
            <div className="space-y-3">
              {[
                { label: "Total Persistent Jobs", value: jobs.length, color: "text-white" },
                { label: "Rendered & Ready", value: doneCount, color: "text-emerald-400" },
                { label: "In Progress (Polling)", value: activeCount, color: "text-amber-400" },
                { label: "Queued in DB", value: queuedCount, color: "text-gray-400" },
                { label: "Failed / Error", value: failedCount, color: "text-red-400" },
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
                  <span>Completed Proportion</span>
                  <span>{jobs.length > 0 ? Math.round((doneCount / jobs.length) * 100) : 0}%</span>
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
                onClick={() => void refreshLiveStatus()}
                disabled={refreshing}
                className="flex-1 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 font-semibold py-2 rounded-xl text-xs border border-purple-800/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{refreshing ? "⏳" : "🔄"}</span> <span>{refreshing ? "جاري التحديث..." : "Refresh Live Status"}</span>
              </button>
              {jobs.length > 0 && (
                <button 
                  onClick={() => void clearAllJobs()}
                  className="px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-semibold py-2 rounded-xl text-xs border border-red-800/40 transition-all flex items-center justify-center gap-1"
                  title="تفريغ كافة الفيديوهات والمحتوى المصنوع"
                >
                  <span>🗑️</span> <span>تفريغ الكل</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {jobs.length > 0 ? (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Live Production Queue (PostgreSQL)</h2>
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
                        onClick={() => void deleteJob(job.id)}
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
        ) : (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-8 text-center">
            <p className="text-sm font-bold text-white mb-1">No Video Production Jobs Found</p>
            <p className="text-xs text-purple-400">Enter a product name above and click "Launch Real Production Batch" to start rendering on HeyGen servers.</p>
          </div>
        )}

        {/* 📱 REAL VIDEO REVIEW & PLAYER DRAWER */}
        {previewJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="bg-[#120d26] border border-purple-800/40 rounded-2xl p-6 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <button
                onClick={() => setPreviewJob(null)}
                className="absolute top-4 right-4 text-purple-400 hover:text-white text-lg font-bold z-30"
              >
                ✕ Close
              </button>

              {/* Left Column: Phone Frame / Real Video Player */}
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

              {/* Right Column: Details & Real Publishing Status */}
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
                    onClick={() => void fetchJobs()}
                    className="w-full bg-[#1b123a] hover:bg-purple-900/30 text-purple-300 font-bold py-2.5 rounded-xl text-xs border border-purple-800/40 transition-all"
                  >
                    🔄 Check Status Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

