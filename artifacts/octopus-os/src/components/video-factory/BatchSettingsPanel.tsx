import React, { useState } from "react";

export const PLATFORMS_LIST = ["YouTube Shorts", "TikTok", "Instagram Reels", "Pinterest"];

interface BatchSettingsPanelProps {
  product: string;
  setProduct: React.Dispatch<React.SetStateAction<string>>;
  platform: string;
  setPlatform: (v: string) => void;
  videoEngine: string;
  setVideoEngine: (v: string) => void;
  videoStyle: string;
  setVideoStyle: (v: string) => void;
  avatarCharacter: string;
  setAvatarCharacter: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  variationMode: string;
  setVariationMode: (v: string) => void;
  onGenerate: () => void;
  running: boolean;
}

export function BatchSettingsPanel({
  product, setProduct,
  platform, setPlatform,
  videoEngine, setVideoEngine,
  videoStyle, setVideoStyle,
  avatarCharacter, setAvatarCharacter,
  count, setCount,
  variationMode, setVariationMode,
  onGenerate, running
}: BatchSettingsPanelProps) {
  const [isListening, setIsListening] = useState(false);

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("عذراً، متصفحك لا يدعم الإدخال الصوتي.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error("Speech recognition error", e);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setProduct((product) => product + (product ? " " : "") + transcript);
    };
    recognition.start();
  };

  return (
    <div className="lg:col-span-2 bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
      <h2 className="text-sm font-bold text-purple-300 mb-4">⚙️ Multi-Style Production Batch Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-purple-300 mb-1.5">Product Name / Offer</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleListen}
              title="تحدث لإدخال اسم المنتج"
              className={`px-3 rounded-xl border transition-all flex items-center justify-center ${isListening ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse glow-red-sm" : "bg-[#0d0920] border-purple-800/50 text-purple-400 hover:bg-purple-900/50"}`}
            >
              🎙️
            </button>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder={isListening ? "جاري الاستماع..." : "e.g. Genius Wave & Wealth Manifestation"}
              className="flex-1 bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500"
            />
          </div>
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
        onClick={onGenerate}
        disabled={running || !product.trim()}
        className="mt-5 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-xl transition-all text-sm disabled:opacity-50 border border-purple-500/30 glow-purple flex items-center justify-center gap-2"
      >
        {running ? "⏳ Generating Multi-Style Batch..." : `⚡ Launch Real Production Batch (${count} Videos)`}
      </button>
    </div>
  );
}
