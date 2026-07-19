import { useLocation } from "wouter";

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className={className}
    >
      {children}
    </button>
  );
}

export function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0614] text-white flex flex-col font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {/* Navigation Header */}
      <header className="border-b border-purple-900/40 bg-[#0d0920]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-purple-500/40 shadow-lg shadow-purple-500/30 bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-2xl">🐙</div>
            <div>
              <span className="font-black text-xl bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent tracking-wider">
                OCTOPUS
              </span>
              <span className="text-[10px] text-purple-400 block font-mono -mt-1 tracking-widest">AUTONOMOUS AI OS</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-purple-200">
            <a href="#about" className="hover:text-white transition-colors">ما هو OCTOPUS</a>
            <a href="#features" className="hover:text-white transition-colors">ماذا يفعل</a>
            <NavLink href="/demo" className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-bold cursor-pointer bg-transparent border-0 p-0">
              <span>▶ فيديو الشرح (Demo)</span>
            </NavLink>
            <a href="#contact" className="hover:text-white transition-colors">طريقة التواصل</a>
            <NavLink href="/privacy" className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-sm font-medium text-purple-200">الخصوصية</NavLink>
            <NavLink href="/terms" className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-sm font-medium text-purple-200">الشروط</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <NavLink href="/demo" className="md:hidden bg-[#130d2a] border border-purple-800 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
              ▶ Demo
            </NavLink>
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-900/50 flex items-center gap-2 cursor-pointer"
            >
              <span>تسجيل الدخول / الدخول للنظام</span>
              <span>🚀</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/20 via-indigo-600/20 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10" dir="rtl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/40 text-xs font-mono text-cyan-300 mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>نظام التشغيل الذاتي الأول لتسويق وصناعة المحتوى الرقمي بالذكاء الاصطناعي</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            مرحباً بك في <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">OCTOPUS NEXUS</span><br />
            منصة التشغيل والتسويق الذاتي الكامل
          </h1>

          <p className="text-purple-200 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            وداعاً للتدخل البشري والعمل اليدوي المرهق. يمنحك <strong>OCTOPUS</strong> جيشاً كاملاً من وكلاء الذكاء الاصطناعي المستقلين (AI Agents) لاكتشاف الترندات، صياغة المحتوى، توليد الصوت والفيديو، والنشر المباشر على YouTube و TikTok وتحقيق العمولات والأرباح على مدار الساعة.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black px-8 py-4 rounded-2xl text-lg transition-all shadow-xl shadow-purple-900/60 flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
            >
              <span>ابدأ التشغيل الذاتي الآن</span>
              <span>⚡</span>
            </button>
            <button
              onClick={() => navigate("/demo")}
              className="w-full sm:w-auto bg-[#130d2a] hover:bg-purple-900/40 border border-purple-500/50 text-cyan-300 font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg flex items-center justify-center gap-3"
            >
              <span>▶ شاهد شرح الفيديو (60 ثانية)</span>
            </button>
          </div>

          {/* Octopus Icon Showcase */}
          <div className="mt-16 flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-cyan-500 to-indigo-600 rounded-3xl blur opacity-40 group-hover:opacity-75 transition duration-1000" />
              <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-3xl border border-purple-500/40 shadow-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center text-9xl transform transition-transform duration-500 group-hover:scale-105">
                🐙
              </div>
            </div>
            <span className="text-xs font-mono text-purple-400 mt-4 tracking-widest uppercase">OCTOPUS NEXUS OS v7</span>
          </div>
        </div>
      </section>

      {/* Section 1: ما هو OCTOPUS */}
      <section id="about" className="py-20 px-6 bg-[#0d0920]/60 border-t border-b border-purple-900/40" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">ABOUT OCTOPUS</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-2">ما هو OCTOPUS AI OS؟</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-cyan-400 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-cyan-400">🐙</span> نظام تشغيل حقيقي وليس مجرد محاكاة
              </h3>
              <p className="text-purple-200 leading-relaxed text-sm md:text-base mb-4">
                تطبيق <strong>OCTOPUS</strong> تم تصميمه ليكون منصة تشغيل تسويقية ذاتية بالكامل (Autonomous Operating System). على عكس الأدوات التقليدية التي تتطلب إدخال الأوامر والنسخ واللصق يدوياً، يدير نظامنا دورة كاملة ومغلقة (End-to-End Execution).
              </p>
              <p className="text-purple-200 leading-relaxed text-sm md:text-base">
                يعمل النظام عبر عقل مركزي (Brain) يتخذ القرارات، ويدير 10 وكلاء ذكاء اصطناعي متخصصين يعملون بالتوازي لتنفيذ استراتيجيات الأفلييت ومضاعفة العوائد المالية دون تعب.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🧠", title: "العقل المركزي", desc: "مدعوم بـ Gemini 3.1 Pro للتحليل واتخاذ القرار" },
                { icon: "🤖", title: "10 وكلاء مستقلين", desc: "TrendHunter, Creator, VideoFactory, Publisher والمزيد" },
                { icon: "🔗", title: "ربط رسمي بالـ API", desc: "اتصال مباشر وآمن بـ YouTube و TikTok و Digistore24" },
                { icon: "⚡", title: "أتمتة 24/7", desc: "يعمل على خوادم سحابية وينشر المحتوى يومياً دون توقف" },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#130d2a]/80 border border-purple-800/40 rounded-2xl p-5 hover:border-purple-500/50 transition-all">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-purple-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: ماذا يفعل */}
      <section id="features" className="py-20 px-6" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest font-mono">AUTONOMOUS CAPABILITIES</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-2">ماذا يفعل OCTOPUS تحديداً؟</h2>
            <p className="text-purple-300 text-sm md:text-base mt-2">خمس خطوات أوتوماتيكية متكاملة تغنيك عن فريق عمل كامل</p>
            <div className="w-20 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "صيد الترند واختيار المنتج", icon: "🔍", desc: "يقوم الوكيل TrendHunter بمسح الشبكات الاجتماعية واكتشاف المواضيع الأكثر انتشاراً، ثم يختار منتج أفلييت عالي العمولة من Digistore24 أو Clickbank يطابق الترند." },
              { step: "02", title: "كتابة السكربت الإعلاني المبتكر", icon: "✍️", desc: "يقوم الوكيل Creator Agent بصياغة سيناريو إعلاني قصير جذاب ومدروس نفسياً لتحقيق أعلى معدل الاحتفاظ بالمشاهدين (Retention Rate) والنقرات." },
              { step: "03", title: "توليد الصوت والفيديو بالـ AI", icon: "🎬", desc: "يتم استدعاء محركات ElevenLabs لتوليد صوت بشري طبيعي باللغة العربية أو الإنجليزية، ومحركات HeyGen لتوليد فيديو 9:16 احترافي بأفاتار يتحدث بطلاقة." },
              { step: "04", title: "النشر التلقائي على القنوات", icon: "🚀", desc: "يتولى الوكيل Publisher الرفع والنشر المباشر عبر بروتوكولات الـ API الرسمية على TikTok و YouTube Shorts مع كتابة العنوان والتاجات ورابط الشراء." },
              { step: "05", title: "تتبع العمولات والتحسين الذاتي", icon: "📈", desc: "يراقب Tracker Agent عدد المشاهدات والنقرات والمبيعات، ويقوم محرك القرار (Brain) بتعديل الاستراتيجية واقتراح تحسينات لحملتك في الوقت الفعلي." },
              { step: "06", title: "شاهد الشرح الكامل في 60 ثانية", icon: "▶️", desc: "هل تريد رؤية كل هذه الخطوات في بث محاكاة تفاعلي حي؟ قم بزيارة صفحة فيديو الشرح الآن لمشاهدة دورة العمل من البداية حتى النهاية.", link: true },
            ].map((card, idx) => (
              <div key={idx} className="bg-[#130d2a]/90 border border-purple-900/50 rounded-3xl p-6 hover:border-cyan-400/50 transition-all flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-4 left-4 text-2xl font-black text-purple-900/60 group-hover:text-purple-500/30 font-mono transition-colors">
                  {card.step}
                </div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl mb-4">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-xs md:text-sm text-purple-200 leading-relaxed">{card.desc}</p>
                </div>
                {card.link && (
                  <button onClick={() => navigate("/demo")} className="mt-4 inline-block text-sm font-bold text-cyan-400 hover:text-white transition-colors text-right cursor-pointer bg-transparent border-0 p-0">
                    شاهد Demo الآن ←
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: طريقة التواصل */}
      <section id="contact" className="py-20 px-6 bg-[#0d0920]/60 border-t border-purple-900/40" dir="rtl">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">CONTACT & SUPPORT</span>
          <h2 className="text-3xl font-black text-white mt-2 mb-4">طريقة التواصل والدعم الفني</h2>
          <p className="text-purple-300 text-sm md:text-base max-w-2xl mx-auto mb-10">
            فريق التطوير والدعم متاح للرد على جميع استفساراتكم التقنية والتجارية، والمساعدة في ربط خوادم Railway أو إعداد مفاتيح الـ API.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#130d2a] border border-purple-800/40 rounded-2xl p-6">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-bold text-white text-sm mb-1">البريد الإلكتروني للدعم</h3>
              <p className="text-xs text-purple-300 font-mono mb-3">support@octopus.ai</p>
              <a href="mailto:support@octopus.ai" className="text-xs text-cyan-400 hover:underline">أرسل رسالة فورية ←</a>
            </div>

            <div className="bg-[#130d2a] border border-purple-800/40 rounded-2xl p-6">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-bold text-white text-sm mb-1">الاستفسارات القانونية والخصوصية</h3>
              <p className="text-xs text-purple-300 font-mono mb-3">legal@octopus.ai</p>
              <button onClick={() => navigate("/privacy")} className="text-xs text-cyan-400 hover:underline cursor-pointer bg-transparent border-0 p-0">اقرأ سياسة الخصوصية ←</button>
            </div>

            <div className="bg-[#130d2a] border border-purple-800/40 rounded-2xl p-6">
              <div className="text-3xl mb-3">🐙</div>
              <h3 className="font-bold text-white text-sm mb-1">بوابة المطورين والوثائق</h3>
              <p className="text-xs text-purple-300 font-mono mb-3">docs.octopus.ai</p>
              <button onClick={() => navigate("/demo")} className="text-xs text-cyan-400 hover:underline cursor-pointer bg-transparent border-0 p-0">شاهد الديمو التفاعلي ←</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-900/40 bg-[#070410] py-10 px-6 text-sm text-purple-300" dir="rtl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center text-lg border border-purple-500/30">🐙</div>
            <span className="font-black text-white">OCTOPUS AI OS</span>
            <span className="text-xs text-purple-500 font-mono">| الإصدار الذاتي 2.0</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs md:text-sm font-medium">
            <button onClick={() => navigate("/")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-purple-300">الرئيسية</button>
            <button onClick={() => navigate("/demo")} className="text-cyan-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0">▶ الشرح (Demo)</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-purple-300">سياسة الخصوصية</button>
            <button onClick={() => navigate("/terms")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-purple-300">شروط الاستخدام</button>
            <a href="#contact" className="hover:text-white transition-colors">التواصل</a>
            <button onClick={() => navigate("/login")} className="text-purple-400 hover:text-white transition-colors font-bold cursor-pointer bg-transparent border-0 p-0">تسجيل الدخول</button>
          </div>

          <div className="text-xs text-purple-500">
            © {new Date().getFullYear()} OCTOPUS AI OS. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
