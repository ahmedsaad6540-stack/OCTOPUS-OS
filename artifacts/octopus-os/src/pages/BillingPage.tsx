import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const PLANS = [
  { id: "starter", name: "Starter", price: 29, features: ["5 AI Agents", "3 Social Platforms", "5 Affiliate Networks", "1,000 AI Requests/mo", "Basic Analytics"] },
  { id: "pro", name: "Pro", price: 99, popular: true, features: ["10 AI Agents", "15 Social Platforms", "All Affiliate Networks", "50,000 AI Requests/mo", "Full Analytics", "Video Factory", "Workflow Builder"] },
  { id: "business", name: "Business", price: 299, features: ["Unlimited Agents", "All Platforms", "All Networks", "500,000 AI Requests/mo", "Advanced Analytics", "All Features", "Priority Support", "Multi-Workspace"] },
  { id: "enterprise", name: "Enterprise", price: 999, features: ["Custom Agents", "White Label", "Dedicated Infrastructure", "Unlimited Requests", "Custom Integrations", "SLA 99.99%", "Dedicated Support"] },
];

export function BillingPage() {
  const { token } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [current, setCurrent] = useState("pro");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/settings/me/billing_plan`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.setting?.value) {
          setCurrent(data.setting.value);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const selectPlan = async (planId: string) => {
    if (!token) return;
    setCurrent(planId);
    try {
      await fetch(`${API_BASE}/settings/me/billing_plan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: planId })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">💳 Billing</h1>
        <p className="text-purple-400/60 text-xs mt-1">Manage your plan and billing</p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm ${!annual ? "text-white" : "text-purple-400/60"}`}>Monthly</span>
        <button onClick={() => setAnnual(!annual)}
          className={`w-12 h-6 rounded-full transition-all relative ${annual ? "bg-purple-600" : "bg-gray-700"}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${annual ? "left-7" : "left-1"}`}></div>
        </button>
        <span className={`text-sm ${annual ? "text-white" : "text-purple-400/60"}`}>Annual <span className="text-emerald-400 text-xs font-bold">-20%</span></span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {PLANS.map(p => (
          <div key={p.id} className={`card-os p-5 relative ${p.popular ? "border-purple-500/40" : ""} ${current === p.id ? "border-emerald-500/30" : ""}`}>
            {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full gradient-purple text-white text-[10px] font-bold">POPULAR</div>}
            {current === p.id && <div className="absolute -top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">CURRENT</div>}
            <h3 className="font-bold text-white text-sm mb-1">{p.name}</h3>
            <div className="mb-4">
              <span className="text-2xl font-bold text-white">${annual ? Math.round(p.price * 0.8) : p.price}</span>
              <span className="text-xs text-purple-400/60">/mo</span>
            </div>
            <ul className="space-y-2 mb-4">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-purple-300/70">
                  <span className="text-emerald-400 shrink-0 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => selectPlan(p.id)}
              className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${current === p.id ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30" : "gradient-purple text-white"}`}>
              {current === p.id ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card-os p-4">
          <h3 className="text-sm font-bold text-purple-300 mb-3">🧾 Recent Invoices</h3>
          {[["Jul 1, 2026", "Pro Plan", "$99.00", "paid"], ["Jun 1, 2026", "Pro Plan", "$99.00", "paid"], ["May 1, 2026", "Starter Plan", "$29.00", "paid"]].map(([date, plan, amount, status]) => (
            <div key={date} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }}>
              <div>
                <div className="text-xs font-medium text-white">{plan}</div>
                <div className="text-[10px] text-purple-400/60">{date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">{amount}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400">{status}</span>
                <button className="text-[10px] text-purple-400 hover:text-purple-300">PDF</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card-os p-4">
          <h3 className="text-sm font-bold text-purple-300 mb-3">💳 Payment Method</h3>
          <div className="p-3 rounded-lg mb-3" style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💳</span>
                <div>
                  <div className="text-xs font-medium text-white">Visa ending in 4242</div>
                  <div className="text-[10px] text-purple-400/60">Expires 12/2028</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400">Default</span>
            </div>
          </div>
          <button className="w-full py-2 rounded-lg text-xs text-purple-300 border border-purple-500/30">+ Add Payment Method</button>
        </div>
      </div>
    </div>
  );
}
