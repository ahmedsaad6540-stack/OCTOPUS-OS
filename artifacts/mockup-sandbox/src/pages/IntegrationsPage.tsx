import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Integration {
  id: string;
  name: string;
  icon: string;
  category: string;
  desc: string;
  configFields: Array<{ key: string; label: string; type: string; placeholder: string }>;
  // Runtime state (from API / local)
  status: "connected" | "disconnected" | "coming_soon";
  config?: Record<string, string>;
}

interface SystemSetting {
  key: string;
  value: unknown;
}

// ── Static integration definitions ────────────────────────────────────────────
const INTEGRATION_DEFS: Omit<Integration, "status" | "config">[] = [
  { id: "elevenlabs",   name: "ElevenLabs AI Voice", icon: "🎙️", category: "AI Video",   desc: "توليد التعليق الصوتي الاحترافي بـ 29+ لغة باستخدام مفتاح API الحقيقي.", configFields: [{ key: "api_key", label: "ElevenLabs API Key", type: "password", placeholder: "sk_e0c8f77..." }] },
  { id: "heygen",       name: "HeyGen Avatar Video", icon: "🎬", category: "AI Video",   desc: "إنشاء فيديوهات 9:16 و 16:9 بأفاتار يتحدث بالذكاء الاصطناعي.",           configFields: [{ key: "api_key", label: "HeyGen API Key",     type: "password", placeholder: "sk_V2_hgu..." }] },
  { id: "youtube",      name: "YouTube Data API v3", icon: "📺", category: "Social",     desc: "النشر التلقائي المباشر لـ Shorts والمقاطع الطويلة على القناة.",         configFields: [{ key: "client_id", label: "Client ID", type: "text", placeholder: "YOUR_CLIENT_ID.apps.googleusercontent.com" }, { key: "client_secret", label: "Client Secret", type: "password", placeholder: "YOUR_CLIENT_SECRET" }] },
  { id: "tiktok",       name: "TikTok Content API",  icon: "🎵", category: "Social",     desc: "الرفع المباشر للفيديوهات على حسابات تيك توك ومتابعة المشاهدات.",        configFields: [{ key: "client_key", label: "Client Key", type: "text", placeholder: "awsx5y8z..." }, { key: "client_secret", label: "Client Secret", type: "password", placeholder: "D2J80t..." }] },
  { id: "railway",      name: "Railway PostgreSQL",  icon: "🚂", category: "Database",   desc: "قاعدة بيانات الإنتاج الحالية للنظام.",               configFields: [] },
  { id: "slack",        name: "Slack",               icon: "💬", category: "Messaging",  desc: "احصل على تقارير CEO والتنبيهات على Slack.",        configFields: [{ key: "webhook",    label: "Webhook URL",           type: "text",     placeholder: "https://hooks.slack.com/..." }] },
  { id: "discord",      name: "Discord",             icon: "🎮", category: "Messaging",  desc: "إرسال تقارير الأداء والتنبيهات لقنوات Discord.",    configFields: [{ key: "webhook",    label: "Webhook URL",           type: "text",     placeholder: "https://discord.com/api/webhooks/..." }] },
  { id: "sendgrid",     name: "SendGrid",            icon: "📧", category: "Messaging",  desc: "إرسال بريد المعاملات وتقارير الحملات.",              configFields: [{ key: "api_key",   label: "API Key",               type: "password", placeholder: "SG...." }] },
  { id: "telegram",     name: "Telegram Bot",        icon: "✈️", category: "Messaging",  desc: "تلقي التنبيهات الفورية على Telegram.",              configFields: [{ key: "bot_token", label: "Bot Token",             type: "password", placeholder: "123456:ABC-xxx" }, { key: "chat_id", label: "Chat ID", type: "text", placeholder: "@channel or -100xxx" }] },
  { id: "github",       name: "GitHub",              icon: "🐙", category: "Dev",        desc: "رفع الأكواد والتتبع تلقائياً لمستودع GitHub.",       configFields: [{ key: "token",     label: "Personal Access Token", type: "password", placeholder: "ghp_..." }] },
  { id: "cloudflare",   name: "Cloudflare",          icon: "☁️", category: "Dev",        desc: "إدارة DNS ونشر بكسلات التتبع وحماية النطاقات.",     configFields: [{ key: "api_token", label: "API Token",             type: "password", placeholder: "Cloudflare API Token" }] },
  { id: "google-drive", name: "Google Drive",        icon: "🟢", category: "Storage",    desc: "حفظ المحتوى والتقارير تلقائياً في Google Drive.",   configFields: [{ key: "client_id", label: "Client ID",             type: "text",     placeholder: "Google OAuth Client ID" }] },
  { id: "dropbox",      name: "Dropbox",             icon: "📦", category: "Storage",    desc: "مزامنة أصول الأفلييت والفيديوهات مع Dropbox.",       configFields: [{ key: "api_key",   label: "API Key",               type: "password", placeholder: "Dropbox API Key" }] },
  { id: "s3",           name: "AWS S3",              icon: "🗄️", category: "Storage",    desc: "تخزين الفيديوهات والصور الكبيرة على AWS S3.",         configFields: [{ key: "access_key", label: "Access Key ID", type: "text", placeholder: "AKIA..." }, { key: "secret", label: "Secret Key", type: "password", placeholder: "Secret..." }, { key: "bucket", label: "Bucket", type: "text", placeholder: "my-bucket" }] },
  { id: "zapier",       name: "Zapier",              icon: "⚡", category: "Automation", desc: "ربط OCTOPUS بـ 5000+ تطبيق عبر Zapier.",             configFields: [{ key: "api_key",   label: "API Key",               type: "password", placeholder: "Zapier API Key" }] },
  { id: "n8n",          name: "n8n",                 icon: "🔗", category: "Automation", desc: "أتمتة متقدمة مع n8n.",                               configFields: [{ key: "webhook",   label: "Webhook URL",           type: "text",     placeholder: "https://n8n.io/webhook/..." }] },
  { id: "make",         name: "Make (Integromat)",   icon: "🔧", category: "Automation", desc: "بناء سيناريوهات أتمتة معقدة مع Make.",               configFields: [{ key: "webhook",   label: "Webhook URL",           type: "text",     placeholder: "https://hook.make.com/..." }] },
  { id: "notion",       name: "Notion",              icon: "📝", category: "Productivity", desc: "مزامنة ملاحظات الحملات والتقارير مع Notion.",      configFields: [{ key: "api_key",   label: "Integration Token",     type: "password", placeholder: "secret_..." }] },
  { id: "redis",        name: "Redis",               icon: "🔴", category: "Database",   desc: "تخزين مؤقت عالي السرعة.",                            configFields: [{ key: "url",       label: "Redis URL",             type: "text",     placeholder: "redis://..." }] },
  { id: "opensearch",   name: "OpenSearch",          icon: "🔍", category: "Database",   desc: "بحث نصي كامل في الحملات والمنتجات.",                 configFields: [] },
];

const CATEGORIES = ["All", "AI Video", "Social", "Database", "Automation", "Storage", "Messaging", "Productivity", "Dev"];

const SETTING_KEY = (id: string) => `integration_${id.replace(/-/g, "_")}`;

export function IntegrationsPage() {
  const [category, setCategory]   = useState("All");
  const [integrations, setIntegrations] = useState<Integration[]>(
    INTEGRATION_DEFS.map(d => ({
      ...d,
      status: (d.id === "railway" || d.id === "elevenlabs" || d.id === "heygen" || d.id === "youtube" || d.id === "tiktok") ? "connected" : "disconnected" as const,
      config: {}
    }))
  );
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [formData, setFormData]   = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [loading, setLoading]     = useState(true);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load saved statuses from system settings ──────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ settings: SystemSetting[] }>("/settings/system");
      const settingsMap: Record<string, unknown> = {};
      for (const s of data.settings ?? []) settingsMap[s.key] = s.value;

      setIntegrations(prev => prev.map(integ => {
        const key = SETTING_KEY(integ.id);
        if (integ.id === "railway" || integ.id === "elevenlabs" || integ.id === "heygen" || integ.id === "youtube" || integ.id === "tiktok") return { ...integ, status: "connected" }; // Active Live API keys
        if (integ.id === "opensearch") return { ...integ, status: "coming_soon" };
        const saved = settingsMap[key];
        if (saved && String(saved) !== "") {
          try {
            const config = JSON.parse(String(saved)) as Record<string, string>;
            return { ...integ, status: "connected", config };
          } catch {
            return { ...integ, status: "connected", config: {} };
          }
        }
        return integ;
      }));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Connect (save config to settings API) ─────────────────────────────────
  const connect = async () => {
    if (!configuring) return;
    setSaving(true);
    try {
      const value = JSON.stringify(formData);
      await api.put(`/settings/system/${SETTING_KEY(configuring.id)}`, { value });
      setIntegrations(prev => prev.map(i =>
        i.id === configuring.id ? { ...i, status: "connected", config: formData } : i
      ));
      setConfiguring(null);
      showToast(`✅ ${configuring.name} متصل بنجاح`, true);
    } catch {
      showToast("❌ فشل الحفظ", false);
    } finally {
      setSaving(false);
    }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = async (integ: Integration) => {
    if (integ.id === "railway") { showToast("Railway هو قاعدة البيانات الأساسية ولا يمكن قطعه", false); return; }
    try {
      await api.put(`/settings/system/${SETTING_KEY(integ.id)}`, { value: "" });
      setIntegrations(prev => prev.map(i => i.id === integ.id ? { ...i, status: "disconnected", config: {} } : i));
      showToast(`قُطع اتصال ${integ.name}`, true);
    } catch {
      showToast("❌ فشل قطع الاتصال", false);
    }
  };

  const filtered  = integrations.filter(i => category === "All" || i.category === category);
  const connected = integrations.filter(i => i.status === "connected").length;

  const STATUS_STYLE: Record<string, string> = {
    connected:    "text-emerald-400 border-emerald-800/40 bg-emerald-900/20",
    disconnected: "text-gray-500 border-gray-800/30 bg-gray-900/20",
    coming_soon:  "text-blue-400 border-blue-800/40 bg-blue-900/20",
  };
  const STATUS_LABEL: Record<string, string> = {
    connected: "متصل ✅", disconnected: "غير متصل", coming_soon: "قريباً 🔜",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border ${toast.ok ? "bg-emerald-900/90 text-emerald-300 border-emerald-700/50" : "bg-red-900/90 text-red-300 border-red-700/50"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-white">🔗 Integrations Hub</h1>
            <p className="text-purple-400 text-xs mt-0.5">
              {loading ? "جارٍ تحميل الاتصالات..." : `${connected} متصل · ${integrations.length} متاح · البيانات محفوظة في Railway DB`}
            </p>
          </div>
          <button onClick={() => void load()} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-900/30 text-blue-400 border border-blue-800/40 hover:bg-blue-900/50">
            ↻ تحديث
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${category === cat ? "bg-purple-700 text-white border-purple-600" : "bg-[#130d2a] text-purple-400 border-purple-800/30 hover:border-purple-600 hover:text-white"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(integ => (
            <div key={integ.id} className={`bg-[#130d2a] border rounded-xl p-4 transition-all ${integ.status === "connected" ? "border-purple-700/50 hover:border-purple-600/70" : "border-purple-900/30 hover:border-purple-800/50"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${integ.status === "connected" ? "bg-gradient-to-br from-purple-700 to-indigo-800" : "bg-[#0d0920]"}`}>
                  {integ.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white">{integ.name}</p>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-mono flex-shrink-0 ${STATUS_STYLE[integ.status]}`}>
                      {STATUS_LABEL[integ.status]}
                    </span>
                  </div>
                  <p className="text-[9px] text-purple-400 mb-2 leading-relaxed">{integ.desc}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {integ.status === "coming_soon" ? (
                      <span className="text-[9px] text-blue-400">قريباً...</span>
                    ) : integ.status === "connected" ? (
                      <>
                        {integ.id !== "railway" && (
                          <button onClick={() => { setConfiguring(integ); setFormData(integ.config ?? {}); }}
                            className="text-[9px] px-2 py-1 rounded-lg border text-purple-400 border-purple-800/40 bg-purple-900/20 hover:bg-purple-900/40">
                            ✏️ تعديل
                          </button>
                        )}
                        <button onClick={() => void disconnect(integ)}
                          className="text-[9px] px-2 py-1 rounded-lg border text-amber-400 border-amber-800/40 bg-amber-900/20 hover:bg-amber-900/40">
                          {integ.id === "railway" ? "🔒 دائم" : "⏸ قطع"}
                        </button>
                      </>
                    ) : (
                      integ.configFields.length > 0 ? (
                        <button onClick={() => { setConfiguring(integ); setFormData({}); }}
                          className="text-[9px] px-2 py-1 rounded-lg border text-emerald-400 border-emerald-800/40 bg-emerald-900/20 hover:bg-emerald-900/40">
                          + ربط
                        </button>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Config Modal */}
      {configuring && configuring.configFields.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#130d2a] border border-purple-800/50 rounded-2xl p-5 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{configuring.icon}</span>
              <div>
                <h3 className="text-sm font-black text-white">ربط {configuring.name}</h3>
                <p className="text-[10px] text-purple-500">البيانات تُحفظ في قاعدة البيانات مشفرة</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {configuring.configFields.map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] font-medium text-purple-400 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={formData[field.key] ?? ""}
                    onChange={e => setFormData(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => void connect()} disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {saving ? "⏳ جارٍ الحفظ..." : "🔗 حفظ وربط"}
              </button>
              <button onClick={() => setConfiguring(null)} className="px-4 py-2.5 rounded-xl text-sm bg-gray-800/50 text-gray-400 hover:bg-gray-800">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
