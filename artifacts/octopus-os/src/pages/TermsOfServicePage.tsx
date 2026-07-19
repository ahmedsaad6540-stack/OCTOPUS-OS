import { useLocation } from "wouter";

export function TermsOfServicePage() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-[#0a0614] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-purple-900/40 bg-[#0d0920]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0">
          <div className="w-9 h-9 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center text-xl">🐙</div>
          <div>
            <span className="font-black text-lg bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent tracking-wider">
              OCTOPUS
            </span>
            <span className="text-[10px] text-purple-400 block font-mono -mt-1 tracking-widest">AUTONOMOUS AI OS</span>
          </div>
        </button>
        <div className="flex items-center gap-4 text-sm">
          <button onClick={() => navigate("/")} className="text-purple-300 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0">الرئيسية</button>
          <button onClick={() => navigate("/privacy")} className="text-purple-300 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0">سياسة الخصوصية</button>
          <button onClick={() => navigate("/login")} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-purple-900/30 cursor-pointer">
            تسجيل الدخول
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full" dir="rtl">
        <div className="bg-[#130d2a]/80 border border-purple-900/40 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-purple-900/40">
            <div className="w-14 h-14 rounded-2xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-3xl shadow-inner">
              📜
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">شروط الاستخدام (Terms of Service)</h1>
              <p className="text-sm text-purple-400 mt-1 font-mono">آخر تحديث: {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          <div className="space-y-8 text-purple-200 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">1.</span> قبول الشروط والأحكام
              </h2>
              <p>
                بدخولك واستخدامك لمنصة <strong>OCTOPUS AI OS</strong> وتطبيقاتها المتصلة، فإنك توافق التزاماً كاملاً بشروط الاستخدام هذه. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى التوقف عن استخدام المنصة على الفور.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">2.</span> وصف الخدمة
              </h2>
              <p>
                <strong>OCTOPUS AI OS</strong> هو نظام تشغيل تسويقي مستقل يعتمد على وكلاء الذكاء الاصطناعي (AI Agents) لتنفيذ مهام التسويق بالعمولة (Affiliate Marketing) وصناعة ونشر المحتوى الرقمي تلقائياً على منصات مثل YouTube و TikTok، بالإضافة إلى تتبع المبيعات والعمولات.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">3.</span> مسؤولية حساب المستخدم ومفاتيح الـ API
              </h2>
              <p className="mb-2">أنت تدرك وتوافق على ما يلي فيما يخص حسابك:</p>
              <ul className="list-disc list-inside space-y-2 text-purple-300 pr-4">
                <li>أنت المسؤول الوحيد عن الحفاظ على سرية بيانات دخولك ومفاتيح الـ API التي تدخلها بالمنصة.</li>
                <li>أنت توافق على أن منصة OCTOPUS تعمل كأداة تنفيذية بالنيابة عنك وتستخدم التوكنز والصلاحيات التي منحتها لها لنشر المحتوى والتفاعل وفق القواعد التي تقوم بضبطها.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">4.</span> الاستخدام المقبول والمحظورات
              </h2>
              <p className="mb-2">تتعهد بعدم استخدام نظام OCTOPUS في أي من الأنشطة التالية:</p>
              <ul className="list-disc list-inside space-y-2 text-purple-300 pr-4">
                <li>نشر محتوى مخالف للقوانين الدولية أو المحلية، أو محتوى يحض على الكراهية والعنف أو الاحتيال.</li>
                <li>انتهاك حقوق الملكية الفكرية لحسابات الغير أو انتهاك شروط الخدمة الخاصة بمنصات التواصل الاجتماعي (TikTok, YouTube) أو شبكات الأفلييت.</li>
                <li>إرسال رسائل غير مرغوب فيها (Spam) أو محاولة اختراق أو تعطيل خوادم المنصة.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">5.</span> إخلاء المسؤولية وحدود التضمين
              </h2>
              <p>
                يتم تقديم الخدمة كما هي ("As Is") دون ضمانات صريحة أو ضمنية بتحقيق قدر معين من الأرباح أو المبيعات. تعتمد نتائج الحملات التسويقية على جودة المنتجات المختارة، وحالة السوق، وتغيرات خوارزميات منصات التواصل الاجتماعي. لا تتحمل منصة OCTOPUS أي مسؤولية عن أي خسائر مباشرة أو غير مباشرة أو إغلاق لحسابات السوشيال ميديا نتيجة سوء إعدادات الحملات من قبل المستخدم.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">6.</span> التعديلات على الشروط
              </h2>
              <p>
                نحتفظ بالحق في مراجعة وتحديث هذه الشروط في أي وقت لتتوافق مع التطورات التقنية والتنظيمية. سيتم إشعار المستخدمين بأي تعديلات جوهرية عبر لوحة التحكم أو البريد الإلكتروني.
              </p>
            </section>

            <section className="bg-[#1a123a]/60 border border-purple-500/30 rounded-2xl p-6 mt-8">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                📬 الاستفسارات القانونية
              </h3>
              <p className="text-purple-300 text-sm mb-3">
                لأي أسئلة قانونية أو استفسارات حول شروط الاستخدام، يمكنك التواصل معنا عبر البريد المخصص:
              </p>
              <div className="font-mono text-cyan-400 text-sm">
                📧 البريد الإلكتروني: <a href="mailto:terms@octopus.ai" className="underline hover:text-white">terms@octopus.ai</a>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-900/40 py-6 px-6 text-center text-xs text-purple-400">
        <p>© {new Date().getFullYear()} OCTOPUS AI OS. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
