import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types matching the real /social API schema ───────────────────────────────
interface SocialAccount {
  id: string;
  platform: string;
  displayName: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  apiKey: string;
  apiSecret: string;
  status: string;
  followers: string;
  tokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Platform metadata (icons, colours, field definitions) ───────────────────
interface PlatformMeta {
  id: string;
  name: string;
  icon: string;
  color: string;
  fields: Array<{ key: keyof SocialAccount | string; label: string; type: string; placeholder: string; required?: boolean }>;
}

const PLATFORM_META: PlatformMeta[] = [
  {
    id: "twitter", name: "X (Twitter)", icon: "🐦", color: "from-sky-900/30 border-sky-800/40",
    fields: [
      { key: "apiKey",       label: "API Key",       type: "text",     placeholder: "Twitter API Key",      required: true },
      { key: "apiSecret",    label: "API Secret",    type: "password", placeholder: "Twitter API Secret",   required: true },
      { key: "accessToken",  label: "Access Token",  type: "password", placeholder: "OAuth access token" },
      { key: "refreshToken", label: "Token Secret",  type: "password", placeholder: "OAuth token secret" },
    ],
  },
  {
    id: "facebook", name: "Facebook", icon: "👤", color: "from-blue-900/30 border-blue-800/40",
    fields: [
      { key: "apiKey",      label: "App ID",       type: "text",     placeholder: "Meta App ID",         required: true },
      { key: "apiSecret",   label: "App Secret",   type: "password", placeholder: "Meta App Secret",     required: true },
      { key: "accessToken", label: "Page Token",   type: "password", placeholder: "Facebook page token" },
    ],
  },
  {
    id: "instagram", name: "Instagram", icon: "📸", color: "from-purple-900/30 border-purple-800/40",
    fields: [
      { key: "apiKey",      label: "App ID",       type: "text",     placeholder: "Meta App ID",         required: true },
      { key: "apiSecret",   label: "App Secret",   type: "password", placeholder: "Meta App Secret",     required: true },
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "Long-lived page token" },
    ],
  },
  {
    id: "tiktok", name: "TikTok", icon: "🎵", color: "from-pink-900/30 border-pink-800/40",
    fields: [
      { key: "apiKey",       label: "Client ID",     type: "text",     placeholder: "TikTok Client ID",     required: true },
      { key: "apiSecret",    label: "Client Secret", type: "password", placeholder: "TikTok Client Secret", required: true },
      { key: "accessToken",  label: "Access Token",  type: "password", placeholder: "Long-lived access token" },
      { key: "refreshToken", label: "Refresh Token", type: "password", placeholder: "Refresh token" },
    ],
  },
  {
    id: "youtube", name: "YouTube", icon: "📺", color: "from-red-900/30 border-red-800/40",
    fields: [
      { key: "apiKey",       label: "Client ID",     type: "text",     placeholder: "Google Client ID",    required: true },
      { key: "apiSecret",    label: "Client Secret", type: "password", placeholder: "Google Client Secret", required: true },
      { key: "accessToken",  label: "Access Token",  type: "password", placeholder: "OAuth access token" },
      { key: "refreshToken", label: "Refresh Token", type: "password", placeholder: "OAuth refresh token" },
    ],
  },
  {
    id: "github", name: "GitHub", icon: "🐱", color: "from-gray-900/30 border-gray-800/40",
    fields: [
      { key: "apiKey",      label: "Personal Token", type: "password", placeholder: "ghp_xxxxxxxxxxxx", required: true },
      { key: "username",    label: "Username",        type: "text",     placeholder: "GitHub username" },
    ],
  },
  {
    id: "pinterest", name: "Pinterest", icon: "📌", color: "from-red-900/30 border-red-800/40",
    fields: [
      { key: "apiKey",      label: "App ID",       type: "text",     placeholder: "Pinterest App ID",    required: true },
      { key: "apiSecret",   label: "App Secret",   type: "password", placeholder: "Pinterest App Secret", required: true },
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "Pinterest access token" },
    ],
  },
  {
    id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-blue-900/30 border-blue-800/40",
    fields: [
      { key: "apiKey",      label: "Client ID",     type: "text",     placeholder: "LinkedIn Client ID",  required: true },
      { key: "apiSecret",   label: "Client Secret", type: "password", placeholder: "LinkedIn Secret",     required: true },
      { key: "accessToken", label: "Access Token",  type: "password", placeholder: "OAuth access token" },
    ],
  },
  {
    id: "telegram", name: "Telegram", icon: "✈️", color: "from-cyan-900/30 border-cyan-800/40",
    fields: [
      { key: "apiKey",     label: "Bot Token",  type: "password", placeholder: "123456:ABC-xxx",              required: true },
      { key: "username",   label: "Channel ID", type: "text",     placeholder: "@yourchannel or -100xxxxxxxxxx" },
    ],
  },
  {
    id: "discord", name: "Discord", icon: "🎮", color: "from-indigo-900/30 border-indigo-800/40",
    fields: [
      { key: "apiKey",      label: "Bot Token",   type: "password", placeholder: "Discord bot token",  required: true },
      { key: "username",    label: "Server ID",   type: "text",     placeholder: "Discord Server ID" },
      { key: "accessToken", label: "Webhook URL", type: "text",     placeholder: "https://discord.com/api/webhooks/..." },
    ],
  },
  {
    id: "reddit", name: "Reddit", icon: "🤖", color: "from-orange-900/30 border-orange-800/40",
    fields: [
      { key: "apiKey",    label: "Client ID",     type: "text",     placeholder: "Reddit App Client ID", required: true },
      { key: "apiSecret", label: "Client Secret", type: "password", placeholder: "Reddit App Secret",   required: true },
      { key: "username",  label: "Username",       type: "text",     placeholder: "u/your-username" },
    ],
  },
  {
    id: "threads", name: "Threads", icon: "🧵", color: "from-gray-900/30 border-gray-800/40",
    fields: [
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "Threads API token", required: true },
      { key: "username",    label: "User ID",       type: "text",     placeholder: "Threads User ID" },
    ],
  },
];

const STATUS_CFG: Record<string, { dot: string; text: string; badge: string; label: string }> = {
  connected:    { dot: "bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]", text: "text-emerald-400", badge: "bg-emerald-900/20 border-emerald-800/30 text-emerald-400", label: "متصل" },
  expired:      { dot: "bg-amber-400",  text: "text-amber-400",  badge: "bg-amber-900/20 border-amber-800/30 text-amber-400",   label: "منتهي" },
  disconnected: { dot: "bg-gray-700",   text: "text-gray-500",   badge: "bg-gray-900/20 border-gray-800/20 text-gray-500",      label: "غير متصل" },
  pending:      { dot: "bg-blue-400 animate-pulse", text: "text-blue-400", badge: "bg-blue-900/20 border-blue-800/30 text-blue-400", label: "جارٍ" },
};

const PLATFORM_ICON: Record<string, string> = Object.fromEntries(PLATFORM_META.map(p => [p.id, p.icon]));
const PLATFORM_NAME: Record<string, string> = Object.fromEntries(PLATFORM_META.map(p => [p.id, p.name]));
const PLATFORM_COLOR: Record<string, string> = Object.fromEntries(PLATFORM_META.map(p => [p.id, p.color]));

// ── Helper: get form fields for a platform ───────────────────────────────────
function getFields(platform: string) {
  return PLATFORM_META.find(p => p.id === platform)?.fields ?? [];
}

// ── Blank account shell for adding new ──────────────────────────────────────
function blankAccount(platform: string): Omit<SocialAccount, "id" | "createdAt" | "updatedAt"> {
  const meta = PLATFORM_META.find(p => p.id === platform);
  return {
    platform,
    displayName: meta?.name ?? platform,
    username: "",
    accessToken: "",
    refreshToken: "",
    apiKey: "",
    apiSecret: "",
    status: "disconnected",
    followers: "0",
    tokenExpiresAt: null,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SocialPage() {
  const [accounts, setAccounts]     = useState<SocialAccount[]>([]);
  const [selected, setSelected]     = useState<SocialAccount | null>(null);
  const [form, setForm]             = useState<Partial<SocialAccount>>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [addingPlatform, setAddingPlatform] = useState<string | null>(null);

  // ── Load all accounts from API ─────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ accounts: SocialAccount[] }>("/social");
      setAccounts(data.accounts ?? []);
      if (data.accounts?.length) {
        const first = data.accounts[0];
        setSelected(first);
        setForm(first);
      }
    } catch (e) {
      showToast("تعذّر تحميل الحسابات", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Select an existing account ─────────────────────────────────────────────
  const selectAccount = (acc: SocialAccount) => {
    setSelected(acc);
    setForm(acc);
    setAddingPlatform(null);
  };

  // ── Start adding a new platform ────────────────────────────────────────────
  const startAdd = (platformId: string) => {
    setAddingPlatform(platformId);
    const blank = { ...blankAccount(platformId), id: "", createdAt: "", updatedAt: "" } as SocialAccount;
    setSelected(blank);
    setForm(blank);
  };

  // ── Save (POST new or PUT existing) ───────────────────────────────────────
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (selected.id) {
        // Update existing
        const data = await api.put<{ account: SocialAccount }>(`/social/${selected.id}`, payload);
        setAccounts(prev => prev.map(a => a.id === selected.id ? data.account : a));
        setSelected(data.account);
        setForm(data.account);
        showToast("✅ تم الحفظ بنجاح", true);
      } else {
        // Create new
        const data = await api.post<{ account: SocialAccount }>("/social", {
          ...payload,
          status: "connected",
        });
        setAccounts(prev => [...prev, data.account]);
        setSelected(data.account);
        setForm(data.account);
        setAddingPlatform(null);
        showToast("✅ تم ربط الحساب بنجاح", true);
      }
    } catch (err: unknown) {
      showToast("❌ " + (err instanceof Error ? err.message : "فشل الحفظ"), false);
    } finally {
      setSaving(false);
    }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = async (acc: SocialAccount) => {
    try {
      await api.put<{ account: SocialAccount }>(`/social/${acc.id}`, {
        status: "disconnected",
        accessToken: "",
        refreshToken: "",
        apiKey: "",
        apiSecret: "",
      });
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, status: "disconnected" } : a));
      if (selected?.id === acc.id) {
        const updated = { ...acc, status: "disconnected" };
        setSelected(updated);
        setForm(updated);
      }
      showToast("تم قطع الاتصال", true);
    } catch {
      showToast("❌ فشل قطع الاتصال", false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const remove = async (acc: SocialAccount) => {
    if (!confirm(`هل تريد حذف حساب ${acc.displayName}؟`)) return;
    try {
      await api.delete(`/social/${acc.id}`);
      const remaining = accounts.filter(a => a.id !== acc.id);
      setAccounts(remaining);
      if (selected?.id === acc.id) {
        setSelected(remaining[0] ?? null);
        setForm(remaining[0] ?? {});
      }
      showToast("تم الحذف", true);
    } catch {
      showToast("❌ فشل الحذف", false);
    }
  };

  const connected = accounts.filter(a => a.status === "connected").length;
  const currentFields = selected ? getFields(selected.platform) : [];
  const platformsWithoutAccounts = PLATFORM_META.filter(p => !accounts.find(a => a.platform === p.id));

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0614] flex flex-col md:flex-row">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border ${toast.ok ? "bg-emerald-900/90 text-emerald-300 border-emerald-700/50" : "bg-red-900/90 text-red-300 border-red-700/50"}`}>
          {toast.msg}
        </div>
      )}

      {/* Left: Account List */}
      <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-purple-900/30 flex flex-col max-h-72 md:max-h-none">
        <div className="p-3 border-b border-purple-900/30 flex-shrink-0">
          <h1 className="text-sm font-black text-white">📱 Social Hub</h1>
          <p className="text-[10px] text-purple-500 mt-0.5">
            {loading ? "جارٍ التحميل..." : `${connected}/${accounts.length} متصل`}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* Connected accounts */}
          {accounts.map(acc => {
            const cfg = STATUS_CFG[acc.status] ?? STATUS_CFG.disconnected;
            const active = selected?.id === acc.id && !addingPlatform;
            return (
              <button
                key={acc.id}
                onClick={() => selectAccount(acc)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-left transition-all border ${active ? "bg-gradient-to-r from-purple-800/60 to-indigo-800/40 border-purple-700/40 text-white" : "border-transparent text-purple-400 hover:bg-purple-900/20"}`}
              >
                <span className="text-sm flex-shrink-0">{PLATFORM_ICON[acc.platform] ?? "📡"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-white">{PLATFORM_NAME[acc.platform] ?? acc.platform}</p>
                  <p className="text-[9px] text-purple-600 truncate">{acc.username || acc.displayName}</p>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              </button>
            );
          })}

          {/* Add new platform section */}
          {platformsWithoutAccounts.length > 0 && (
            <div className="mt-3">
              <p className="text-[9px] text-purple-800 uppercase font-bold px-2 mb-1">إضافة منصة</p>
              {platformsWithoutAccounts.slice(0, 8).map(p => (
                <button
                  key={p.id}
                  onClick={() => startAdd(p.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-0.5 text-left transition-all border ${addingPlatform === p.id ? "bg-purple-800/30 border-purple-700/40 text-white" : "border-transparent text-purple-700 hover:text-purple-400 hover:bg-purple-900/20"}`}
                >
                  <span className="text-sm">{p.icon}</span>
                  <span className="text-[10px] font-medium">{p.name}</span>
                  <span className="ml-auto text-[9px] text-purple-800">+ ربط</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Config Panel */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {!selected && !loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-purple-700 text-sm">اختر منصة من القائمة</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-purple-600 text-sm animate-pulse">جارٍ تحميل الحسابات من قاعدة البيانات...</p>
          </div>
        )}

        {selected && !loading && (() => {
          const meta = PLATFORM_META.find(p => p.id === selected.platform);
          const cfg = STATUS_CFG[selected.status] ?? STATUS_CFG.disconnected;
          const isNew = !selected.id;
          return (
            <div className="max-w-lg">
              {/* Header */}
              <div className={`bg-gradient-to-br ${PLATFORM_COLOR[selected.platform] ?? "from-purple-900/30 border-purple-800/40"} border rounded-xl p-4 mb-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{PLATFORM_ICON[selected.platform] ?? "📡"}</span>
                  <div className="flex-1">
                    <h2 className="text-base font-black text-white">{PLATFORM_NAME[selected.platform] ?? selected.platform}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span className={`text-[10px] font-mono ${cfg.text}`}>{cfg.label}</span>
                      {selected.username && <span className="text-[10px] text-purple-500">{selected.username}</span>}
                    </div>
                  </div>
                  {!isNew && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  )}
                </div>
                {!isNew && selected.followers !== "0" && (
                  <p className="text-xs text-purple-400">👥 {selected.followers} متابع</p>
                )}
              </div>

              {/* Credential Fields */}
              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4 space-y-3 mb-4">
                <p className="text-xs font-bold text-purple-300 mb-2">🔑 بيانات الاتصال</p>

                {/* Username field (always shown) */}
                <div>
                  <label className="block text-[10px] font-medium text-purple-400 mb-1">اسم المستخدم / المعرف</label>
                  <input
                    type="text"
                    value={form.username ?? ""}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="@username أو ID"
                    className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                {/* Dynamic fields per platform */}
                {currentFields.map(field => {
                  const key = field.key as keyof SocialAccount;
                  return (
                    <div key={field.key}>
                      <label className="block text-[10px] font-medium text-purple-400 mb-1">
                        {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <input
                        type={field.type}
                        value={(form[key] as string) ?? ""}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 transition-all font-mono"
                        autoComplete="off"
                      />
                    </div>
                  );
                })}

                {/* Status select */}
                <div>
                  <label className="block text-[10px] font-medium text-purple-400 mb-1">الحالة</label>
                  <select
                    value={form.status ?? "disconnected"}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="connected">متصل ✅</option>
                    <option value="disconnected">غير متصل ❌</option>
                    <option value="expired">منتهي الصلاحية ⚠️</option>
                    <option value="pending">قيد الانتظار ⏳</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => void save()}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "⏳ جارٍ الحفظ..." : isNew ? "🔗 ربط الحساب" : "💾 حفظ التغييرات"}
                </button>

                {!isNew && selected.status === "connected" && (
                  <button
                    onClick={() => void disconnect(selected)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-900/30 text-amber-400 border border-amber-800/40 hover:bg-amber-900/50 transition-all"
                  >
                    ⏸ قطع
                  </button>
                )}

                {!isNew && (
                  <button
                    onClick={() => void remove(selected)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-all"
                  >
                    🗑
                  </button>
                )}
              </div>

              {/* Info notice */}
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                <p className="text-[10px] text-blue-300">
                  💡 البيانات المُدخلة تُحفظ مشفرة في قاعدة البيانات على Railway. لا تُرسل لأي جهة خارجية.
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
