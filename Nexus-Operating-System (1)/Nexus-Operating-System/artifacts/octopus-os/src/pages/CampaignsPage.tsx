import { useState } from "react";

const INITIAL = [
  { id: 1, name: "TikTok Weight Loss", platform: "TikTok", status: "active", revenue: "$842", roi: "4.2x", posts: 34 },
  { id: 2, name: "Amazon Fitness", platform: "Amazon", status: "active", revenue: "$421", roi: "3.1x", posts: 12 },
  { id: 3, name: "ClickBank AI Tools", platform: "ClickBank", status: "paused", revenue: "$284", roi: "2.8x", posts: 8 },
  { id: 4, name: "Pinterest Beauty", platform: "Pinterest", status: "active", revenue: "$156", roi: "5.4x", posts: 45 },
];

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(INITIAL);

  const toggle = (id: number) => {
    setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: c.status === "active" ? "paused" : "active" } : c));
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">📣 Campaigns</h1>
          <p className="text-purple-400/60 text-xs mt-1">{campaigns.filter(c => c.status === "active").length} active</p>
        </div>
        <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple">+ New Campaign</button>
      </div>
      <div className="card-os overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
              {["Campaign","Platform","Status","Revenue","ROI","Posts","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-purple-400/60 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id} style={{ borderBottom:"1px solid rgba(139,92,246,0.06)" }} className="hover:bg-purple-900/10">
                <td className="px-4 py-3 font-semibold text-white">{c.name}</td>
                <td className="px-4 py-3 text-purple-300">{c.platform}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === "active" ? "bg-emerald-900/50 text-emerald-400" : "bg-yellow-900/50 text-yellow-400"}`}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-emerald-400 font-bold">{c.revenue}</td>
                <td className="px-4 py-3 text-purple-300">{c.roi}</td>
                <td className="px-4 py-3 text-white">{c.posts}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(c.id)}
                    className={`px-2 py-1 rounded-md text-[10px] ${c.status === "active" ? "bg-yellow-900/40 text-yellow-400" : "bg-emerald-900/40 text-emerald-400"}`}>
                    {c.status === "active" ? "Pause" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
