import React from "react";

export function PrivacyPolicyPage() {
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
            <span className="text-[10px] text-purple-400 block font-mono -mt-1 tracking-widest">AUTONOMOUS AI OS</span>
          </div>
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/" className="text-purple-300 hover:text-white transition-colors">الرئيسية</a>
          <a href="/terms" className="text-purple-300 hover:text-white transition-colors">شروط الاستخدام</a>
          <a href="/login" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-purple-900/30">
            تسجيل الدخول
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full" dir="rtl">
        <div className="bg-[#130d2a]/80 border border-purple-900/40 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-purple-900/40">
            <div className="w-14 h-14 rounded-2xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-3xl shadow-inner">
              🔒
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">سياسة الخصوصية (Privacy Policy)</h1>
              <p className="text-sm text-purple-400 mt-1 font-mono">آخر تحديث: {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          <div className="space-y-8 text-purple-200 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">1.</span> مقدمة عامة
              </h2>
              <p>
                نرحب بكم في منصة <strong>OCTOPUS AI OS</strong>. نحن نلتزم بحماية خصوصيتكم وأمان بياناتكم الشخصية وبيانات أنشطتكم التجارية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات التي يتم تزويدنا بها عند استخدامكم لمنصة التشغيل الذاتي الخاصة بنا وتطبيقاتها المتصلة (مثل حسابات تيك توك، يوتيوب، شبكات الأفلييت، وخدمات الذكاء الاصطناعي).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">2.</span> البيانات التي نقوم بجمعها
              </h2>
              <p className="mb-2">نقوم بجمع الأنواع التالية من البيانات لضمان تشغيل النظام بكفاءة:</p>
              <ul className="list-disc list-inside space-y-2 text-purple-300 pr-4">
                <li><strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، ومعلومات تسجيل الدخول المشفرة.</li>
                <li><strong>مفاتيح الربط والتوكنز (API Tokens & OAuth Credentials):</strong> مفاتيح الربط التي تقوم بإدخالها لربط منصات التواصل الاجتماعي (TikTok, YouTube, X) ومزودي الذكاء الاصطناعي (OpenAI, Gemini, ElevenLabs, HeyGen). يتم تشفير هذه المفاتيح وتخزينها بأمان تام باستخدام أحدث معايير التشفير ولا يتم مشاركتها أبداً مع أي طرف ثالث.</li>
                <li><strong>بيانات الحملات والأداء:</strong> الإحصائيات، النقرات، المبيعات، والعمولات المستردة من شبكات الأفلييت (مثل Digistore24 و Clickbank) لتحسين أداء الحملات تلقائياً عبر العقل المركزي (Brain).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">3.</span> كيف نستخدم بياناتك
              </h2>
              <p className="mb-2">نستخدم المعلومات المجمعة حصرياً للأغراض التالية:</p>
              <ul className="list-disc list-inside space-y-2 text-purple-300 pr-4">
                <li>تشغيل دورة العمل الذاتية (Autopilot Pipeline): صياغة المحتوى، توليد الفيديوهات والصوت، والنشر المباشر.</li>
                <li>إدارة الحسابات المرتبطة عبر صلاحيات الـ API المصرح بها من قبلك فقط.</li>
                <li>تحليل البيانات وتقديم تقارير واقتراحات لتحسين أرباح الحملات التسويقية.</li>
                <li>حماية المنصة من الاستخدام غير المصرح به وضمان استقرار الخوادم.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">4.</span> مشاركة وتداول البيانات
              </h2>
              <p>
                <strong>نحن لا نبيع أو نؤجر أو نتاجر ببياناتك الشخصية أو مفاتيح الـ API الخاصة بك تحت أي ظرف.</strong> يتم إرسال استفسارات التوليد والنشر فقط إلى الخدمات الرسمية المربوطة بحسابك (مثل Google/YouTube API و TikTok Content Posting API و ElevenLabs) لتنفيذ المهام المحددة برغبتك.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">5.</span> أمان وتشفير المعلومات
              </h2>
              <p>
                نطبق إجراءات أمنية صارمة، بما في ذلك تشفير الاتصالات عبر بروتوكول <code>HTTPS/TLS</code> وتشفير قاعدة البيانات (PostgreSQL/Drizzle)، لضمان حماية معلوماتك وحساباتك من أي وصول غير مصرح به.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-purple-400">6.</span> حقوقك وحذف البيانات (Data Deletion)
              </h2>
              <p>
                يحق لك في أي وقت مراجعة أو تعديل أو طلب حذف بياناتك وحسابك وكافة التوكنز المرتبطة به بشكل كامل ونهائي. يمكنك طلب حذف البيانات مباشرة من داخل لوحة الإعدادات (Settings → Danger Zone → Delete Account) أو عبر التواصل معنا عبر البريد الإلكتروني أدناه.
              </p>
            </section>

            <section className="bg-[#1a123a]/60 border border-purple-500/30 rounded-2xl p-6 mt-8">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                📬 التواصل مع فريق الخصوصية
              </h3>
              <p className="text-purple-300 text-sm mb-3">
                إذا كان لديك أي أسئلة أو استفسارات تتعلق بسياسة الخصوصية أو أمان معلوماتك، يمكنك التواصل معنا مباشرة:
              </p>
              <div className="font-mono text-cyan-400 text-sm">
                📧 البريد الإلكتروني: <a href="mailto:privacy@octopus.ai" className="underline hover:text-white">privacy@octopus.ai</a>
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
