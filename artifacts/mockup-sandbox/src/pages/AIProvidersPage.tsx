import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types from /provider-configs API ─────────────────────────────────────────
interface ProviderConfig {
  id: string;
  name: string;
  providerType: string;
  model: string;
  apiKeyEnvVar: string;
  baseUrl?: string | null;
  isDefault: boolean;
  status: "active" | "disabled";
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Static metadata per provider type ─────────────────────────────────────────
interface ProviderMeta {
  type: string;
  name: string;
  icon: string;
  color: string;
  models: string[];
  apiKeyName: string;
  baseUrl?: string;
  description: string;
}

const PROVIDER_META: ProviderMeta[] = [
  {
    type: "openai", name: "OpenAI", icon: "🤖", color: "from-emerald-900/30 border-emerald-800/40",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    apiKeyName: "OPENAI_API_KEY", description: "أقوى نماذج GPT-4o",
  },
  {
    type: "gemini", name: "Google Gemini", icon: "♊", color: "from-blue-900/30 border-blue-800/40",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"],
    apiKeyName: "GEMINI_API_KEY", description: "نماذج Google Gemini",
  },
  {
    type: "anthropic", name: "Anthropic Claude", icon: "🔮", color: "from-orange-900/30 border-orange-800/40",
    models: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku", "claude-sonnet-4-5"],
    apiKeyName: "ANTHROPIC_API_KEY", description: "نماذج Claude من Anthropic",
  },
  {
    type: "deepseek", name: "DeepSeek", icon: "🌊", color: "from-cyan-900/30 border-cyan-800/40",
    models: ["deepseek-chat", "deepseek-coder"],
    apiKeyName: "DEEPSEEK_API_KEY", description: "نماذج DeepSeek الصينية",
  },
  {
    type: "mistral", name: "Mistral AI", icon: "🌪️", color: "from-purple-900/30 border-purple-800/40",
    models: ["mistral-large", "mistral-medium", "mistral-small"],
    apiKeyName: "MISTRAL_API_KEY", description: "نماذج Mistral الأوروبية",
  },
  {
    type: "together", name: "Together AI", icon: "🤝", color: "from-indigo-900/30 border-indigo-800/40",
    models: ["meta-llama/Llama-3-70b", "mistralai/Mixtral-8x7B"],
    apiKeyName: "TOGETHER_API_KEY", description: "Open-source models API",
  },
  {
    type: "openrouter", name: "OpenRouter", icon: "🔀", color: "from-violet-900/30 border-violet-800/40",
    models: ["auto", "anthropic/claude-3.5-sonnet", "openai/gpt-4o"],
    apiKeyName: "OPENROUTER_API_KEY", description: "بوابة لجميع النماذج",
  },
  {
    type: "xai", name: "xAI Grok", icon: "🌑", color: "from-gray-900/30 border-gray-800/40",
    models: ["grok-beta", "grok-2", "grok-3"],
    apiKeyName: "XAI_API_KEY", description: "نماذج Grok من xAI",
  },
];

const META_BY_TYPE = Object.fromEntries(PROVIDER_META.map(m => [m.type, m]));

// ── Empty form for new provider ───────────────────────────────────────────────
const EMPTY_FORM: Partial<ProviderConfig> = {
  name: "", providerType: "openai", model: "gpt-4o",
  apiKeyEnvVar: "OPENAI_API_KEY", isDefault: false, status: "active",
};

export function AIProvidersPage() {
  const [configs, setConfigs]       = useState<ProviderConfig[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<Partial<ProviderConfig> | null>(null);
  const [isNew, setIsNew]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [tab, setTab]               = useState<"list" | "failover">("list");

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load from real API ─────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ configs: ProviderConfig[] }>("/provider-configs");
      setConfigs(data.configs ?? []);
    } catch {
      showToast("تعذّر تحميل مزودي الذكاء الاصطناعي", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Open edit modal ────────────────────────────────────────────────────────
  const openEdit = (cfg: ProviderConfig) => {
    setModal({ ...cfg });
    setIsNew(false);
  };

  // ── Open new modal ─────────────────────────────────────────────────────────
  const openNew = (type?: string) => {
    const meta = type ? META_BY_TYPE[type] : PROVIDER_META[0];
    setModal({
      ...EMPTY_FORM,
      providerType: meta?.type ?? "openai",
      name: meta?.name ?? "New Provider",
      model: meta?.models[0] ?? "gpt-4o",
      apiKeyEnvVar: meta?.apiKeyName ?? "API_KEY",
    });
    setIsNew(true);
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const save = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      if (isNew) {
        const data = await api.post<{ config: ProviderConfig }>("/provider-configs", modal);
        setConfigs(prev => [...prev, data.config]);
        showToast("✅ تمت الإضافة بنجاح", true);
      } else {
        const data = await api.put<{ config: ProviderConfig }>(`/provider-configs/${modal.id}`, modal);
        setConfigs(prev => prev.map(c => c.id === modal.id ? data.config : c));
        showToast("✅ تم الحفظ بنجاح", true);
      }
      setModal(null);
    } catch (err: unknown) {
      showToast("❌ " + (err instanceof Error ? err.message : "فشل الحفظ"), false);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle enabled/disabled ────────────────────────────────────────────────
  const toggleStatus = async (cfg: ProviderConfig) => {
    const newStatus: "active" | "disabled" = cfg.status === "active" ? "disabled" : "active";
    try {
      const data = await api.put<{ config: ProviderConfig }>(`/provider-configs/${cfg.id}`, { status: newStatus });
      setConfigs(prev => prev.map(c => c.id === cfg.id ? data.config : c));
      showToast(newStatus === "active" ? "✅ مُفعَّل" : "⏸ مُوقَف", true);
    } catch {
      showToast("❌ فشل تغيير الحالة", false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const remove = async (cfg: ProviderConfig) => {
    if (!confirm(`هل تريد حذف ${cfg.name}؟`)) return;
    try {
      await api.delete(`/provider-configs/${cfg.id}`);
      setConfigs(prev => prev.filter(c => c.id !== cfg.id));
      showToast("تم الحذف", true);
    } catch {
      showToast("❌ فشل الحذف", false);
    }
  };

  // ── Set as default ─────────────────────────────────────────────────────────
  const setDefault = async (cfg: ProviderConfig) => {
    try {
      // Unset all others first
      await Promise.all(configs.filter(c => c.isDefault && c.id !== cfg.id).map(c =>
        api.put(`/provider-configs/${c.id}`, { isDefault: false })
      ));
      const data = await api.put<{ config: ProviderConfig }>(`/provider-configs/${cfg.id}`, { isDefault: true });
      await load();
      showToast(`✅ ${cfg.name} هو المزود الافتراضي`, true);
    } catch {
      showToast("❌ فشل التعيين كافتراضي", false);
    }
  };

  const activeCount = configs.filter(c => c.status === "active").length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border ${toast.ok ? "bg-emerald-900/90 text-emerald-300 border-emerald-700/50" : "bg-red-900/90 text-red-300 border-red-700/50"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-white">⚡ AI Providers</h1>
            <p className="text-xs text-purple-500 mt-0.5">
              {loading ? "جارٍ التحميل..." : `${activeCount}/${configs.length} مُفعَّل · البيانات من Railway DB`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-900/30 text-blue-400 border border-blue-800/40 hover:bg-blue-900/50">
              ↻ تحديث
            </button>
            <button onClick={() => openNew()} className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:opacity-90">
              + إضافة مزود
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-[#130d2a] border border-purple-900/30 rounded-xl p-1">
          {(["list", "failover"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white" : "text-purple-500 hover:text-white"}`}>
              {t === "list" ? "📋 القائمة" : "🔄 Failover Chain"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-purple-600 animate-pulse">جارٍ تحميل المزودين من قاعدة البيانات...</div>
        ) : tab === "list" ? (
          <>
            {/* Existing Configs */}
            {configs.length === 0 ? (
              <div className="text-center py-12 text-purple-700 text-sm">
                <p className="text-3xl mb-3">🔮</p>
                <p>لا يوجد مزودو ذكاء اصطناعي بعد</p>
                <button onClick={() => openNew()} className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-purple-800/40 text-purple-300 border border-purple-700/40">
                  + إضافة أول مزود
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {configs.map(cfg => {
                  const meta = META_BY_TYPE[cfg.providerType];
                  const isActive = cfg.status === "active";
                  return (
                    <div key={cfg.id} className={`bg-gradient-to-br ${meta?.color ?? "from-purple-900/30 border-purple-800/40"} border rounded-xl p-4 flex items-center gap-4`}>
                      <span className="text-2xl flex-shrink-0">{meta?.icon ?? "🤖"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-black text-white">{cfg.name}</p>
                          {cfg.isDefault && <span className="text-[8px] bg-amber-800/40 text-amber-300 px-1.5 py-0.5 rounded font-mono">DEFAULT</span>}
                        </div>
                        <p className="text-[10px] text-purple-500 font-mono">{cfg.model}</p>
                        <p className="text-[9px] text-purple-700">{cfg.apiKeyEnvVar}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
                        <button onClick={() => void toggleStatus(cfg)} className={`text-[10px] px-2 py-1 rounded-lg border font-mono ${isActive ? "text-amber-400 border-amber-800/40 bg-amber-900/20" : "text-emerald-400 border-emerald-800/40 bg-emerald-900/20"}`}>
                          {isActive ? "⏸" : "▶"}
                        </button>
                        {!cfg.isDefault && (
                          <button onClick={() => void setDefault(cfg)} className="text-[10px] px-2 py-1 rounded-lg border text-blue-400 border-blue-800/40 bg-blue-900/20 font-mono">
                            ⭐
                          </button>
                        )}
                        <button onClick={() => openEdit(cfg)} className="text-[10px] px-2 py-1 rounded-lg border text-purple-400 border-purple-800/40 bg-purple-900/20 font-mono">
                          ✏️
                        </button>
                        <button onClick={() => void remove(cfg)} className="text-[10px] px-2 py-1 rounded-lg border text-red-400 border-red-800/40 bg-red-900/20 font-mono">
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add more providers */}
            <div>
              <p className="text-xs font-bold text-purple-500 mb-3">إضافة مزود جديد</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PROVIDER_META.filter(m => !configs.find(c => c.providerType === m.type)).map(meta => (
                  <button
                    key={meta.type}
                    onClick={() => openNew(meta.type)}
                    className="bg-[#130d2a] border border-purple-900/30 rounded-xl p-3 text-left hover:border-purple-700/50 transition-all"
                  >
                    <span className="text-xl block mb-1">{meta.icon}</span>
                    <p className="text-xs font-bold text-white">{meta.name}</p>
                    <p className="text-[9px] text-purple-600">{meta.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Failover Chain View */
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
            <p className="text-xs font-bold text-purple-300 mb-4">سلسلة Failover التلقائي — بناءً على ترتيب الأولوية</p>
            {configs.filter(c => c.status === "active").length === 0 ? (
              <p className="text-purple-700 text-sm text-center py-8">لا يوجد مزودون نشطون</p>
            ) : (
              <div className="flex flex-wrap gap-3 items-center">
                {configs.filter(c => c.status === "active").map((cfg, i, arr) => {
                  const meta = META_BY_TYPE[cfg.providerType];
                  return (
                    <div key={cfg.id} className="flex items-center gap-3">
                      <div className={`text-center px-4 py-3 rounded-xl border bg-gradient-to-br ${meta?.color ?? "from-purple-900/30 border-purple-800/40"}`}>
                        <span className="text-xl block">{meta?.icon ?? "🤖"}</span>
                        <p className="text-xs font-bold text-white mt-1">{cfg.name}</p>
                        <p className="text-[9px] text-purple-500 font-mono">{cfg.model}</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto mt-1 animate-pulse" />
                        {cfg.isDefault && <span className="text-[8px] text-amber-300">⭐ default</span>}
                      </div>
                      {i < arr.length - 1 && <span className="text-purple-700 font-bold text-lg">→</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#130d2a] border border-purple-800/50 rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-black text-white mb-4">
              {isNew ? "➕ إضافة مزود جديد" : `✏️ تعديل ${modal.name}`}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-purple-400 mb-1">الاسم</label>
                <input value={modal.name ?? ""} onChange={e => setModal(m => ({ ...m!, name: e.target.value }))}
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500" />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-purple-400 mb-1">نوع المزود</label>
                <select value={modal.providerType ?? "openai"} onChange={e => {
                  const meta = META_BY_TYPE[e.target.value];
                  setModal(m => ({ ...m!, providerType: e.target.value, name: meta?.name ?? m!.name, model: meta?.models[0] ?? m!.model, apiKeyEnvVar: meta?.apiKeyName ?? m!.apiKeyEnvVar }));
                }} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500">
                  {PROVIDER_META.map(m => <option key={m.type} value={m.type}>{m.icon} {m.name}</option>)}
                  <option value="custom">🔧 Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-purple-400 mb-1">النموذج (Model)</label>
                <input value={modal.model ?? ""} onChange={e => setModal(m => ({ ...m!, model: e.target.value }))}
                  list={`models-${modal.providerType}`}
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="gpt-4o" />
                <datalist id={`models-${modal.providerType}`}>
                  {(META_BY_TYPE[modal.providerType ?? ""]?.models ?? []).map(m => <option key={m} value={m} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-purple-400 mb-1">اسم متغير API Key</label>
                <input value={modal.apiKeyEnvVar ?? ""} onChange={e => setModal(m => ({ ...m!, apiKeyEnvVar: e.target.value }))}
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="OPENAI_API_KEY" />
                <p className="text-[9px] text-purple-700 mt-1">اسم المتغير البيئي الذي يحتوي على المفتاح في Railway</p>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-purple-400 mb-1">Base URL (اختياري)</label>
                <input value={modal.baseUrl ?? ""} onChange={e => setModal(m => ({ ...m!, baseUrl: e.target.value }))}
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="https://api.openai.com/v1" />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-purple-400 mb-1">الحالة</label>
                <select value={modal.status ?? "active"} onChange={e => setModal(m => ({ ...m!, status: e.target.value as "active" | "disabled" }))}
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500">
                  <option value="active">✅ نشط</option>
                  <option value="disabled">❌ موقوف</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={modal.isDefault ?? false} onChange={e => setModal(m => ({ ...m!, isDefault: e.target.checked }))}
                  className="accent-purple-600 w-4 h-4" />
                <span className="text-xs text-purple-300">تعيين كمزود افتراضي</span>
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => void save()} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {saving ? "⏳ جارٍ الحفظ..." : "💾 حفظ"}
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl text-sm bg-gray-800/50 text-gray-400 hover:bg-gray-800">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
