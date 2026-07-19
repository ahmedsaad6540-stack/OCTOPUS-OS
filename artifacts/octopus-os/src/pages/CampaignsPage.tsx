import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Campaign {
  id: number | string;
  name: string;
  platform: string;
  status: string;
  revenue?: string;
  roi?: string;
  posts?: number;
  productUrl?: string;
  affiliateNetwork?: string;
}

interface NewCampaignForm {
  name: string;
  platform: string;
}

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Pinterest", "Amazon", "ClickBank", "Other"];

export function CampaignsPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewCampaignForm>({ name: "", platform: "TikTok" });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // Profit Engine State
  const [engineRunning, setEngineRunning] = useState(false);
  const [engineResult, setEngineResult] = useState<any>(null);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* ── Profit Engine Trigger ── */
  const startProfitEngine = async () => {
    if (!token) return;
    setEngineRunning(true);
    setEngineResult(null);
    try {
      const res = await fetch(`${API_BASE}/social/publish`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: "Viral TikTok & YouTube Shorts for Affiliate Links",
          description: "Auto-generated promotional content by Profit Engine",
          platforms: ["all"],
          aiOptimize: true
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start engine");
      setEngineResult({ success: true, message: data.summary || "تم نشر وتوزيع الحملات بنجاح!" });
    } catch (err: any) {
      setEngineResult({ success: false, message: err.message });
    } finally {
      setEngineRunning(false);
    }
  };

  /* ── Fetch campaigns on mount ── */
  useEffect(() => {
    if (!token) return;
    fetchCampaigns();
  }, [token]);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/campaigns`, { headers });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const list: Campaign[] = Array.isArray(data) ? data : data.campaigns ?? [];
      setCampaigns(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  /* ── Create campaign ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: form.name.trim(), platform: form.platform }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const created: Campaign = await res.json();
      setCampaigns((prev) => [created, ...prev]);
      setForm({ name: "", platform: "TikTok" });
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete campaign ── */
  const handleDelete = async (id: number | string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete campaign");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Toggle status (optimistic, PATCH & Real Launch) ── */
  const handleToggle = async (campaign: Campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    // Optimistic update
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: newStatus } : c))
    );
    try {
      if (newStatus === "active") {
        const res = await fetch(`${API_BASE}/production/launch-campaign/${campaign.id}`, {
          method: "POST",
          headers,
        });
        if (res.ok) {
          alert(`🚀 [REAL PRODUCTION LAUNCH]\n\nتم تفعيل حملة "${campaign.name}" وبدء إنتاج رندر الفيديو الحقيقي عبر HeyGen/AI والإعداد للنشر المباشر على منصة ${campaign.platform || 'تيك توك'}!`);
        } else {
          await fetch(`${API_BASE}/campaigns/${campaign.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: newStatus }),
          });
        }
      } else {
        await fetch(`${API_BASE}/campaigns/${campaign.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: newStatus }),
        });
      }
    } catch {
      // Revert on failure
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaign.id ? { ...c, status: campaign.status } : c
        )
      );
    }
  };

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white font-heading">🚀 الحملات ومحرك الأرباح</h1>
          <p className="text-purple-400 font-semibold text-sm mt-1">
            إدارة الحملات التسويقية ونظام Profit Engine الآلي
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-xl font-bold transition-all text-sm bg-purple-900/40 text-purple-300 border border-purple-500/30 hover:bg-purple-800/60"
          >
            {showForm ? "✕ Cancel" : "+ New Campaign"}
          </button>
          <button
            onClick={startProfitEngine}
            disabled={engineRunning}
            className="px-6 py-2.5 rounded-xl font-bold transition-all text-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50 flex items-center gap-2"
          >
            {engineRunning ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                جاري توليد ونشر الفيديوهات...
              </>
            ) : (
              <>
                <span className="text-lg">💰</span> Start Profit Engine (محرك الأرباح)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Engine Result Notification */}
      {engineResult && (
        <div className={`my-4 p-4 rounded-xl border ${engineResult.success ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-300" : "bg-red-900/30 border-red-500/50 text-red-300"}`}>
          <div className="font-bold flex items-center gap-2">
            {engineResult.success ? "✅ اكتملت المهمة بنجاح!" : "❌ حدث خطأ:"}
          </div>
          <p className="mt-1 text-sm opacity-90">{engineResult.message}</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400/60 hover:text-red-300">
            ✕
          </button>
        </div>
      )}

      {/* New campaign form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="glass-card p-5 rounded-xl mb-6 space-y-4"
        >
          <h2 className="text-sm font-bold text-white mb-2">Create Campaign</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-purple-400/60 uppercase font-semibold tracking-wider block mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Summer TikTok Drop"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-800/40 text-white text-xs focus:outline-none focus:border-purple-500 placeholder-purple-400/30"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-400/60 uppercase font-semibold tracking-wider block mb-1">
                Platform
              </label>
              <select
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-800/40 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create Campaign"}
          </button>
        </form>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin glow-purple" />
        </div>
      ) : campaigns.length === 0 ? (
        /* Empty state */
        <div className="glass-card rounded-2xl py-32 flex flex-col items-center justify-center gap-6 text-center border border-purple-500/10">
          <div className="w-24 h-24 rounded-full bg-purple-900/20 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.1)]">
            <span className="text-6xl opacity-40">📢</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">No Campaigns Yet</h3>
            <p className="text-purple-400/60 text-sm max-w-sm mx-auto">
              Your profit engine needs fuel. Create your first campaign to start generating automated content and revenue.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all hover:scale-105"
          >
            + Create First Campaign
          </button>
        </div>
      ) : (
        /* Premium Campaign Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="group relative glass-card rounded-2xl p-6 border border-purple-500/10 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Animated background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-bold text-white truncate font-heading group-hover:text-purple-300 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-purple-400/60 mt-1 uppercase tracking-wider font-semibold">
                      {c.platform || "Multi-Channel"} • {c.affiliateNetwork || "Network"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide shadow-sm ${
                        c.status === "active"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          : "bg-yellow-950/60 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {c.status === "active" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 mt-6 p-4 rounded-xl bg-black/20 border border-purple-500/5">
                  <div>
                    <div className="text-[10px] text-purple-400/50 uppercase font-bold tracking-wider mb-1">Revenue</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {c.revenue ? `$${c.revenue}` : "$0.00"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-purple-400/50 uppercase font-bold tracking-wider mb-1">Generated Posts</div>
                    <div className="text-xl font-black text-white font-mono">
                      {c.posts ?? 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-purple-500/10">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      c.status === "active"
                        ? "bg-yellow-950/30 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-900/50 hover:border-yellow-400/50"
                        : "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-900/50 hover:border-emerald-400/50"
                    }`}
                  >
                    {c.status === "active" ? "⏸ Pause" : "▶ Activate"}
                  </button>
                  <a
                    href={c.productUrl || "https://www.digistore24.com/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-900/30 border border-purple-500/20 hover:bg-purple-800/50 transition-all flex items-center justify-center gap-2"
                  >
                    🔗 Affiliate Link
                  </a>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="p-2 rounded-lg text-red-400/60 bg-red-950/20 border border-red-500/10 hover:bg-red-900/40 hover:text-red-300 transition-colors disabled:opacity-50"
                    title="Delete Campaign"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
