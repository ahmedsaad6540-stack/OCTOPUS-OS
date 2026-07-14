import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Campaign {
  id: number | string;
  name: string;
  platform: string;
  status: string;
  revenue?: string;
  roi?: string;
  posts?: number;
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

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
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
      const res = await fetch("/api/campaigns", { headers });
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
      const res = await fetch("/api/campaigns", {
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
      const res = await fetch(`/api/campaigns/${id}`, {
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

  /* ── Toggle status (optimistic, PATCH) ── */
  const handleToggle = async (campaign: Campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    // Optimistic update
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: newStatus } : c))
    );
    try {
      await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">📣 Campaigns</h1>
          <p className="text-purple-400/60 text-xs mt-1">
            {loading ? "Loading…" : `${activeCampaigns} active`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple"
        >
          {showForm ? "✕ Cancel" : "+ New Campaign"}
        </button>
      </div>

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
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        /* Empty state */
        <div className="glass-card rounded-xl py-20 flex flex-col items-center justify-center gap-4 text-center">
          <span className="text-5xl opacity-20">📣</span>
          <p className="text-purple-300/60 text-sm font-semibold">No campaigns yet.</p>
          <p className="text-purple-400/40 text-xs">Create your first campaign to start tracking performance.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 px-5 py-2 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple"
          >
            + New Campaign
          </button>
        </div>
      ) : (
        /* Campaign table */
        <div className="card-os overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                {["Campaign", "Platform", "Status", "Revenue", "ROI", "Posts", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-purple-400/60 font-medium"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }}
                  className="hover:bg-purple-900/10"
                >
                  <td className="px-4 py-3 font-semibold text-white">{c.name}</td>
                  <td className="px-4 py-3 text-purple-300">{c.platform}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === "active"
                          ? "bg-emerald-900/50 text-emerald-400"
                          : "bg-yellow-900/50 text-yellow-400"
                      }`}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">
                    {c.revenue ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-purple-300">{c.roi ?? "—"}</td>
                  <td className="px-4 py-3 text-white">{c.posts ?? 0}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(c)}
                      className={`px-2 py-1 rounded-md text-[10px] ${
                        c.status === "active"
                          ? "bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/60"
                          : "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"
                      }`}
                    >
                      {c.status === "active" ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="px-2 py-1 rounded-md text-[10px] bg-red-950/40 text-red-400 hover:bg-red-950/60 disabled:opacity-40"
                    >
                      {deletingId === c.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
