import React, { useState, useEffect } from "react";

const DEMO_STEPS = [
  {
    id: 1,
    timeRange: "0:00 - 0:12",
    startTime: 0,
    endTime: 12,
    title: "1. تسجيل الدخول والتوثيق الآمن",
    subtitle: "Authentication & Identity Setup",
    icon: "🔐",
    description: "يبدأ المستخدم بالدخول إلى نظام OCTOPUS AI OS باستخدام المصادقة الآمنة وتشفير الصلاحيات للتحكم بالوكلاء الذكيين.",
    uiMockup: (
      <div className="bg-[#0d0920] border border-purple-500/40 rounded-2xl p-6 max-w-md mx-auto shadow-2xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-indigo-500" />
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo-1024.jpg" alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-purple-400/40 shadow-lg" />
          <div>
            <h4 className="font-black text-white text-lg">OCTOPUS NEXUS</h4>
            <span className="text-[10px] text-cyan-400 font-mono">SECURE BIOMETRIC / OAUTH LOGIN</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-[#130d2a] border border-purple-800/40 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-purple-300">البريد الإلكتروني:</span>
            <span className="text-white font-mono">admin@octopus.ai</span>
          </div>
          <div className="bg-[#130d2a] border border-purple-800/40 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-purple-300">حالة التشفير:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> AES-256 TLS Active
            </span>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl py-3 text-center text-white font-bold text-sm shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2">
            <span>🚀 جاري تحميل لوحة التحكم الذاتية...</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    timeRange: "0:12 - 0:24",
    startTime: 12,
    endTime: 24,
    title: "2. ربط حسابات TikTok و YouTube",
    subtitle: "Social Account & API Token Linking",
    icon: "🔗",
    description: "ربط القنوات الاجتماعية عبر الرسميات (OAuth & Access Tokens) وإضافة مفاتيح ElevenLabs و HeyGen بضغطة زر.",
    uiMockup: (
      <div className="bg-[#0d0920] border border-purple-500/40 rounded-2xl p-6 max-w-lg mx-auto shadow-2xl relative animate-fade-in">
        <h4 className="font-bold text-white text-sm mb-4 flex items-center justify-between">
          <span>🔗 القنوات المتصلة بالنظام</span>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">جميع القنوات متصلة</span>
        </h4>
        <div className="space-y-3">
          <div className="bg-[#130d2a] border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎵</span>
              <div>
                <div className="text-sm font-bold text-white">TikTok Content Posting API</div>
                <div className="text-[10px] text-purple-400 font-mono">Token: TIKTOK_ACCESS_**** (Active)</div>
              </div>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/30 font-bold">متصل بـ TikTok</span>
          </div>
          <div className="bg-[#130d2a] border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📺</span>
              <div>
                <div className="text-sm font-bold text-white">YouTube Data API v3 (Resumable)</div>
                <div className="text-[10px] text-purple-400 font-mono">OAuth Token: YOUTUBE_REFRESH_****</div>
              </div>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/30 font-bold">متصل بالقناة</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    timeRange: "0:24 - 0:36",
    startTime: 24,
    endTime: 36,
    title: "3. إطلاق حملة تسويق أوتوماتيكية",
    subtitle: "Autopilot Campaign Configuration",
    icon: "🎯",
    description: "اختيار نيتش (مثل الذكاء الاصطناعي أو الصحة) ومنتجات أفلييت من Digistore24 وضبط جدول التشغيل الذاتي للـ Brain.",
    uiMockup: (
      <div className="bg-[#0d0920] border border-purple-500/40 rounded-2xl p-6 max-w-lg mx-auto shadow-2xl relative animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <span>🎯 إعداد حملة:</span>
            <span className="text-cyan-400 font-mono">AI Masterclass Viral Launch</span>
          </h4>
          <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-1 rounded border border-purple-500/30">جدول يومي: 3 فيديوهات</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="bg-[#130d2a] p-3 rounded-xl border border-purple-800/40">
            <div className="text-purple-400 mb-1">شبكة الأفلييت:</div>
            <div className="font-bold text-white">Digistore24 Marketplace</div>
            <div className="text-emerald-400 font-mono mt-1">العمولة: 65% ($85/Sale)</div>
          </div>
          <div className="bg-[#130d2a] p-3 rounded-xl border border-purple-800/40">
            <div className="text-purple-400 mb-1">العقل المركزي (Brain):</div>
            <div className="font-bold text-white">Gemini 3.1 Pro (High)</div>
            <div className="text-cyan-400 font-mono mt-1">التحسين التلقائي: نشط</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 rounded-xl p-3 text-center text-xs text-purple-200">
          ⚡ تم توجيه الوكلاء: TrendHunter و Creator و VideoFactory للبدء بالعمليات الآن...
        </div>
      </div>
    ),
  },
  {
    id: 4,
    timeRange: "0:36 - 0:48",
    startTime: 36,
    endTime: 48,
    title: "4. صناعة المحتوى التلقائية (AI Creation)",
    subtitle: "Script Writing, ElevenLabs Audio & HeyGen Video Rendering",
    icon: "🎨",
    description: "الوكيل يكتب السكربت، يحوله لصوت احترافي عبر ElevenLabs، ثم يصمم فيديو 9:16 بأفاتار يتحدث عبر HeyGen.",
    uiMockup: (
      <div className="bg-[#0d0920] border border-purple-500/40 rounded-2xl p-6 max-w-lg mx-auto shadow-2xl relative animate-fade-in">
        <div className="space-y-3">
          <div className="bg-[#130d2a] border-l-4 border-l-purple-500 p-3 rounded-r-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white flex items-center gap-1.5">✍️ Creator Agent (Script Gen)</span>
              <span className="text-emerald-400">100% مكتمل</span>
            </div>
            <p className="text-[11px] text-purple-300 font-sans italic line-clamp-2">
              "هل تعلم كيف يمكن للذكاء الاصطناعي أن يضاعف دخلك 5 مرات هذا الشهر؟ اكتشف السر عبر الرابط في البايو..."
            </p>
          </div>
          <div className="bg-[#130d2a] border-l-4 border-l-cyan-400 p-3 rounded-r-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">🎙️ ElevenLabs TTS Audio Engine</div>
              <div className="text-[10px] text-cyan-400 font-mono">Voice ID: Rachel (Multilingual Arabic)</div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} className="w-1 bg-cyan-400 rounded-full animate-bounce" style={{ height: `${Math.max(8, (i % 3) * 10)}px`, animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          </div>
          <div className="bg-[#130d2a] border-l-4 border-l-emerald-400 p-3 rounded-r-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">🎬 HeyGen Video Rendering Engine</div>
              <div className="text-[10px] text-emerald-400 font-mono">Aspect: 9:16 | Avatar: Daisy Pro</div>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold">MP4 جاهز للنشر</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    timeRange: "0:48 - 1:00",
    startTime: 48,
    endTime: 60,
    title: "5. النشر المباشر وتتبع الأرباح",
    subtitle: "Automated Publishing & Real-time Revenue Tracking",
    icon: "🚀",
    description: "رفع الفيديو تلقائيًا على TikTok و YouTube Shorts مع تتبع المشاهدات والنقرات والمبيعات وتحقيق الأرباح.",
    uiMockup: (
      <div className="bg-[#0d0920] border border-purple-500/40 rounded-2xl p-6 max-w-lg mx-auto shadow-2xl relative animate-fade-in">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#130d2a] border border-emerald-500/40 rounded-xl p-3.5 text-center">
            <div className="text-xs text-purple-300 mb-1">🎵 نشر TikTok Shorts:</div>
            <div className="text-sm font-black text-emerald-400">✅ تم النشر المباشر</div>
            <div className="text-[10px] text-purple-400 font-mono mt-1">14,280 Views (1st Hour)</div>
          </div>
          <div className="bg-[#130d2a] border border-cyan-500/40 rounded-xl p-3.5 text-center">
            <div className="text-xs text-purple-300 mb-1">📺 نشر YouTube Shorts:</div>
            <div className="text-sm font-black text-cyan-400">✅ تم الرفع بنجاح</div>
            <div className="text-[10px] text-purple-400 font-mono mt-1">Resumable Upload Done</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-950/80 via-[#130d2a] to-emerald-950/80 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-purple-300 font-bold">💰 أرباح الأفلييت المحققة (الآن):</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">$340.00</div>
          </div>
          <div className="text-right text-[11px] text-purple-300">
            <div>النقرات: <span className="text-white font-bold font-mono">482</span></div>
            <div>معدل التحويل: <span className="text-emerald-400 font-bold font-mono">3.4%</span></div>
          </div>
        </div>
      </div>
    ),
  },
];

export function DemoShowcasePage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-progress timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => (prev >= 60 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentStep = DEMO_STEPS.find(
    (step) => currentTime >= step.startTime && currentTime <= step.endTime
  ) || DEMO_STEPS[0];

  return (
    <div className="min-h-screen bg-[#0a0614] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-purple-900/40 bg-[#0d0920]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo-1024.jpg" alt="OCTOPUS Logo" className="w-9 h-9 rounded-xl border border-purple-500/30 shadow-lg shadow-purple-500/20 object-cover" />
          <div>
            <span className="font-black text-lg bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent tracking-wider">
              OCTOPUS
            </span>
            <span className="text-[10px] text-purple-400 block font-mono -mt-1 tracking-widest">INTERACTIVE 1-MIN DEMO</span>
          </div>
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/" className="text-purple-300 hover:text-white transition-colors">الرئيسية</a>
          <a href="/privacy" className="text-purple-300 hover:text-white transition-colors">سياسة الخصوصية</a>
          <a href="/terms" className="text-purple-300 hover:text-white transition-colors">شروط الاستخدام</a>
          <a href="/login" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-purple-900/30">
            تسجيل الدخول
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full flex flex-col" dir="rtl">
        <div className="text-center mb-8">
          <span className="text-xs font-black bg-purple-900/60 text-purple-300 px-3 py-1.5 rounded-full border border-purple-500/30 tracking-widest uppercase mb-3 inline-block">
            ⚡ 60-Second Interactive Autopilot Walkthrough
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-2">
            فيديو وشرح تفاعلي: كيف يعمل <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">OCTOPUS</span> في 60 ثانية
          </h1>
          <p className="text-purple-300 text-sm md:text-base max-w-2xl mx-auto mt-2">
            شاهد المحاكاة الحية لدورة التشغيل الذاتية بالكامل بداية من المصادقة، مروراً بربط TikTok وتوليد الفيديو بالصوت والصورة، وحتى النشر وتحقيق الأرباح.
          </p>
        </div>

        {/* Video Player Box */}
        <div className="bg-[#130d2a]/90 border border-purple-500/40 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md mb-8">
          {/* Progress & Controls Bar */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-900/40">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-purple-900/40 transition-all"
            >
              <span>{isPlaying ? "⏸ إيقاف مؤقت" : "▶ تشغيل المحاكاة"}</span>
            </button>
            
            <div className="flex-1 mx-4">
              <div className="flex justify-between text-xs text-purple-300 mb-1 font-mono">
                <span>المرحلة الحالية: {currentStep.title}</span>
                <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, "0")} / 1:00</span>
              </div>
              <div
                className="w-full h-2.5 bg-[#0d0920] rounded-full overflow-hidden border border-purple-900/60 cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newTime = Math.floor((clickX / rect.width) * 60);
                  setCurrentTime(newTime);
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 transition-all duration-300"
                  style={{ width: `${(currentTime / 60) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setCurrentTime(0)}
              className="bg-[#0d0920] hover:bg-purple-900/40 border border-purple-800/50 text-purple-300 hover:text-white px-3 py-2 rounded-xl text-xs transition-all"
            >
              🔄 إعادة البث
            </button>
          </div>

          {/* Current Step Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-4">
            {/* Left/Description Panel */}
            <div className="md:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/30 text-xs font-mono text-cyan-300">
                <span>⏱ التوقيت: {currentStep.timeRange}</span>
              </div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                <span className="text-3xl">{currentStep.icon}</span>
                <span>{currentStep.title}</span>
              </h2>
              <p className="text-xs text-cyan-400 font-mono -mt-2">{currentStep.subtitle}</p>
              <p className="text-purple-200 text-sm md:text-base leading-relaxed">{currentStep.description}</p>
            </div>

            {/* Right/UI Mockup Panel */}
            <div className="md:col-span-7">
              {currentStep.uiMockup}
            </div>
          </div>
        </div>

        {/* Step Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {DEMO_STEPS.map((step) => {
            const isActive = currentStep.id === step.id;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentTime(step.startTime);
                  setIsPlaying(false);
                }}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-purple-900/50 border-cyan-400/80 shadow-lg shadow-purple-900/40 translate-y-[-2px]"
                    : "bg-[#130d2a]/60 border-purple-900/40 hover:bg-purple-900/20 text-purple-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-[10px] font-mono text-purple-400 bg-[#0d0920] px-2 py-0.5 rounded border border-purple-800/40">
                    {step.timeRange}
                  </span>
                </div>
                <div className="text-xs font-bold text-white line-clamp-1">{step.title}</div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-900/40 py-6 px-6 text-center text-xs text-purple-400">
        <p>© {new Date().getFullYear()} OCTOPUS AI OS. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
