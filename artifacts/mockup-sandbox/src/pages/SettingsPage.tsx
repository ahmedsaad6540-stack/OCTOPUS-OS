import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const SECTIONS = [
  { id: "profile",       title: "الملف الشخصي",  icon: "👤" },
  { id: "security",      title: "الأمان",          icon: "🔐" },
  { id: "system",        title: "الإعدادات",       icon: "⚙️" },
  { id: "oauth",         title: "OAuth URLs",      icon: "🔗" },
  { id: "notifications", title: "الإشعارات",       icon: "🔔" },
  { id: "credentials",   title: "بيانات الاعتماد", icon: "🔑" },
  { id: "danger",        title: "منطقة الخطر",     icon: "⚠️" },
];

function Toggle({ settingKey, defaultVal, label, desc }: { settingKey: string; defaultVal: boolean; label: string; desc: string }) {
  const [val, setVal] = useState(defaultVal);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    const next = !val;
    try {
      await api.put(`/settings/system/${settingKey}`, { value: next });
      setVal(next);
    } catch { /* keep prev */ } finally { setSaving(false); }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-purple-900/20 last:border-0">
      <div>
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="text-[10px] text-purple-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => void toggle()}
        disabled={saving}
        className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors ${val ? "bg-purple-600" : "bg-gray-700"} disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${val ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { user, logout }        = useAuth();
  const [activeSection, setSection] = useState("profile");
  const [domain, setDomain]     = useState("finalsnapshot.vercel.app");
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  // Profile
  const nameRef  = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password
  const [pw, setPw]     = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  // Credentials (from system settings)
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [credSaving, setCredSaving] = useState<string | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Load system settings for credentials section
  const loadSettings = useCallback(async () => {
    try {
      const data = await api.get<{ settings: Array<{ key: string; value: unknown }> }>("/settings/system");
      const map: Record<string, string> = {};
      for (const s of data.settings ?? []) map[s.key] = String(s.value ?? "");
      setCreds(map);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  // ── Save profile ───────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const name  = nameRef.current?.value?.trim();
      const email = emailRef.current?.value?.trim();
      if (name)  await api.put("/settings/system/owner_name",  { value: name });
      if (email) await api.put("/settings/system/owner_email", { value: email });
      showToast("✅ تم حفظ الملف الشخصي", true);
    } catch {
      showToast("❌ فشل الحفظ", false);
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!pw.current || !pw.next) { showToast("يرجى ملء جميع الحقول", false); return; }
    if (pw.next !== pw.confirm)  { showToast("كلمتا المرور غير متطابقتان", false); return; }
    if (pw.next.length < 8)      { showToast("كلمة المرور قصيرة (8 أحرف على الأقل)", false); return; }
    setPwSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      showToast("✅ تم تغيير كلمة المرور", true);
    } catch (err: unknown) {
      showToast("❌ " + (err instanceof Error ? err.message : "فشل تغيير كلمة المرور"), false);
    } finally {
      setPwSaving(false);
    }
  };

  // ── Save a single credential ───────────────────────────────────────────────
  const saveCred = async (key: string) => {
    setCredSaving(key);
    try {
      await api.put(`/settings/system/${key}`, { value: creds[key] ?? "" });
      showToast("✅ تم الحفظ", true);
    } catch {
      showToast("❌ فشل الحفظ", false);
    } finally {
      setCredSaving(null);
    }
  };

  const CREDENTIALS = [
    { key: "github_token",        label: "GitHub Token",        placeholder: "ghp_xxxxxxxxxxxx",  type: "password" },
    { key: "impact_account_id",   label: "Impact Account ID",   placeholder: "7482519",           type: "text" },
    { key: "impact_program_id",   label: "Impact Program ID",   placeholder: "55719",             type: "text" },
    { key: "amazon_tracking_id",  label: "Amazon Tracking ID",  placeholder: "yourname-20",       type: "text" },
    { key: "digistore24_id",      label: "Digistore24 ID",      placeholder: "username4418",      type: "text" },
    { key: "owner_email",         label: "البريد الإلكتروني",   placeholder: "you@gmail.com",      type: "text" },
  ];

  const oauthUrls = [
    { label: "Privacy Policy",  path: `https://${domain}/privacy` },
    { label: "Terms of Service", path: `https://${domain}/terms` },
    { label: "OAuth TikTok",    path: `https://${domain}/oauth/tiktok` },
    { label: "OAuth Google",    path: `https://${domain}/oauth/google` },
    { label: "OAuth Meta",      path: `https://${domain}/oauth/meta` },
    { label: "Redirect URI",    path: `https://${domain}/oauth/callback` },
    { label: "Webhook",         path: `https://${domain}/webhook` },
  ];

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0614] flex flex-col md:flex-row">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border ${toast.ok ? "bg-emerald-900/90 text-emerald-300 border-emerald-700/50" : "bg-red-900/90 text-red-300 border-red-700/50"}`}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar nav */}
      <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-purple-900/30 p-2 flex-shrink-0">
        <h2 className="text-[9px] font-bold text-purple-700 uppercase tracking-widest px-2 mb-2 hidden md:block">الإعدادات</h2>
        <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${activeSection === s.id ? "bg-gradient-to-r from-purple-800/60 to-indigo-800/40 text-white border border-purple-700/40" : "text-purple-400 hover:bg-purple-900/20 hover:text-white"}`}
            >
              <span>{s.icon}</span>
              <span className="font-medium whitespace-nowrap">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">

        {/* ── Profile ── */}
        {activeSection === "profile" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-5">👤 الملف الشخصي</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl font-black text-white">
                  {(user?.name?.[0] ?? "A").toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white">{user?.name}</p>
                  <p className="text-sm text-purple-400">{user?.email}</p>
                  <span className="text-[10px] bg-purple-800/40 text-purple-300 px-2 py-0.5 rounded font-mono">{user?.role}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">الاسم الكامل</label>
                <input ref={nameRef} type="text" defaultValue={user?.name ?? ""} placeholder="اسمك الكامل"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">البريد الإلكتروني</label>
                <input ref={emailRef} type="email" defaultValue={user?.email ?? ""} placeholder="email@example.com"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <button onClick={() => void saveProfile()} disabled={profileSaving}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {profileSaving ? "⏳ جارٍ الحفظ..." : "💾 حفظ التغييرات"}
              </button>
            </div>
          </div>
        )}

        {/* ── Security ── */}
        {activeSection === "security" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-5">🔐 الأمان</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">كلمة المرور الحالية</label>
                <input type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                  placeholder="••••••••" className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">كلمة المرور الجديدة</label>
                <input type="password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                  placeholder="8 أحرف على الأقل" className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">تأكيد كلمة المرور</label>
                <input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="أعد كتابة كلمة المرور" className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <button onClick={() => void changePassword()} disabled={pwSaving}
                className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {pwSaving ? "⏳ جارٍ التحديث..." : "🔐 تحديث كلمة المرور"}
              </button>
            </div>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4 mt-4">
              <h3 className="text-sm font-bold text-white mb-3">الجلسة الحالية</h3>
              <div className="flex items-center justify-between bg-[#0d0920] rounded-lg p-3 border border-purple-900/20">
                <div>
                  <p className="text-xs font-semibold text-white">جلسة نشطة</p>
                  <p className="text-[10px] text-purple-500 mt-0.5">متصفح الويب · الآن · {user?.email}</p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-800/30">نشط</span>
              </div>
            </div>
          </div>
        )}

        {/* ── System ── */}
        {activeSection === "system" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-5">⚙️ الإعدادات العامة</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 space-y-1">
              <p className="text-xs font-bold text-purple-400 mb-3">تبديلات النظام</p>
              <Toggle settingKey="ceo_briefing_enabled"  defaultVal={true}  label="تقرير CEO اليومي"    desc="استقبال تقرير AI CEO كل صباح" />
              <Toggle settingKey="auto_failover_enabled" defaultVal={true}  label="تحويل تلقائي (Failover)" desc="التبديل لمزود آخر عند تعطل الرئيسي" />
              <Toggle settingKey="smart_retry_enabled"   defaultVal={true}  label="إعادة المحاولة"      desc="إعادة تشغيل العمليات الفاشلة تلقائياً" />
              <Toggle settingKey="error_alerts_enabled"  defaultVal={true}  label="تنبيهات الأخطاء"    desc="إشعار عند فشل أي وكيل" />
              <Toggle settingKey="autonomous_mode"       defaultVal={false} label="الوضع التلقائي"      desc="تشغيل الوكلاء يومياً بدون تدخل" />
            </div>
          </div>
        )}

        {/* ── OAuth URLs ── */}
        {activeSection === "oauth" && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-black text-white mb-2">🔗 OAuth URLs</h2>
            <p className="text-xs text-purple-400 mb-5">روابط جاهزة للتسجيل في منصات TikTok وMeta وGoogle وغيرها.</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-purple-300 mb-1.5">نطاقك (Domain)</label>
              <input value={domain} onChange={e => setDomain(e.target.value)}
                className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="yourdomain.com" />
            </div>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              {oauthUrls.map(({ label, path }, i) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < oauthUrls.length - 1 ? "border-b border-purple-900/20" : ""}`}>
                  <p className="text-xs font-semibold text-purple-300 w-36 flex-shrink-0">{label}</p>
                  <p className="text-xs text-white font-mono flex-1 truncate mx-4">{path}</p>
                  <button onClick={() => void navigator.clipboard.writeText(path)}
                    className="text-[10px] bg-[#0d0920] text-purple-400 hover:text-white px-2 py-1 rounded border border-purple-800/30 transition-all flex-shrink-0">
                    نسخ
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notifications ── */}
        {activeSection === "notifications" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-5">🔔 الإشعارات</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <Toggle settingKey="notif_revenue_milestone" defaultVal={true}  label="هدف الإيراد"       desc="عند الوصول لـ $100 أو $500 أو $1000 يومياً" />
              <Toggle settingKey="notif_campaign_alert"    defaultVal={true}  label="تنبيه الحملة"      desc="عند توقف حملة بسبب الميزانية أو خطأ" />
              <Toggle settingKey="notif_trend_detected"    defaultVal={true}  label="ترند جديد"         desc="عند اكتشاف TrendHunter فرصة جديدة" />
              <Toggle settingKey="notif_agent_error"       defaultVal={true}  label="خطأ وكيل"          desc="عند مواجهة أي وكيل لخطأ" />
              <Toggle settingKey="notif_daily_summary"     defaultVal={true}  label="ملخص يومي"         desc="ملخص الأداء في نهاية اليوم" />
              <Toggle settingKey="notif_new_conversion"    defaultVal={false} label="تحويل جديد"        desc="إشعار فوري عند كل بيع" />
            </div>
          </div>
        )}

        {/* ── Credentials ── */}
        {activeSection === "credentials" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-2">🔑 بيانات الاعتماد</h2>
            <p className="text-xs text-purple-400 mb-5">تُحفظ في قاعدة البيانات المشفرة على Railway. لا تُرسل لأي جهة خارجية.</p>
            <div className="space-y-4">
              {CREDENTIALS.map(({ key, label, placeholder, type }) => (
                <div key={key} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
                  <label className="block text-xs font-bold text-purple-300 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type={type}
                      value={creds[key] ?? ""}
                      onChange={e => setCreds(c => ({ ...c, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="flex-1 bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                      autoComplete="off"
                    />
                    <button
                      onClick={() => void saveCred(key)}
                      disabled={credSaving === key}
                      className="px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-700 to-indigo-700 text-white disabled:opacity-50"
                    >
                      {credSaving === key ? "⏳" : "💾"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Danger Zone ── */}
        {activeSection === "danger" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-red-400 mb-5">⚠️ منطقة الخطر</h2>
            <div className="space-y-3">
              <div className="border border-amber-900/40 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-1">حذف جميع بيانات الحملات</h3>
                <p className="text-xs text-purple-400 mb-3">حذف دائم لجميع الحملات وإحصائياتها.</p>
                <button
                  onClick={async () => {
                    if (!confirm("هل أنت متأكد من حذف جميع الحملات؟ لا يمكن التراجع.")) return;
                    try {
                      const data = await api.get<{ campaigns: Array<{ id: string }> }>("/campaigns");
                      await Promise.all((data.campaigns ?? []).map(c => api.delete(`/campaigns/${c.id}`)));
                      showToast("✅ تم حذف جميع الحملات", true);
                    } catch { showToast("❌ فشل الحذف", false); }
                  }}
                  className="bg-red-900/40 hover:bg-red-800/60 text-red-400 border border-red-800/40 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                >
                  حذف البيانات
                </button>
              </div>

              <div className="border border-red-900/60 bg-red-950/10 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-1">تسجيل الخروج</h3>
                <p className="text-xs text-purple-400 mb-3">إنهاء الجلسة الحالية.</p>
                <button onClick={logout}
                  className="bg-red-900/40 hover:bg-red-800/60 text-red-400 border border-red-800/40 text-xs font-bold px-4 py-2 rounded-lg transition-all">
                  ← تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
