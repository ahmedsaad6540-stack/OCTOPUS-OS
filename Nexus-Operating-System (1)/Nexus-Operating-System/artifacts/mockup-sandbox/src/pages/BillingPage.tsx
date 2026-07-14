import { useState } from "react";

const PLANS = [
  { id: "starter", name: "Starter", price: 29, desc: "For solo entrepreneurs", features: ["3 AI Agents", "1 Social Account", "1 Affiliate Network", "1,000 AI requests/mo", "Basic Analytics", "Email Support"] },
  { id: "pro", name: "Pro", price: 79, desc: "For serious affiliates", features: ["All 10 AI Agents", "10 Social Accounts", "Unlimited Affiliates", "50,000 AI requests/mo", "Advanced Analytics", "Video Factory (100/mo)", "Workflow Builder", "Priority Support"], popular: true },
  { id: "business", name: "Business", price: 199, desc: "For teams & agencies", features: ["Everything in Pro", "5 Team Members", "White-label", "API Access", "Custom AI Providers", "250,000 AI requests/mo", "Dedicated Support", "SaaS Mode"] },
  { id: "enterprise", name: "Enterprise", price: null, desc: "For large organizations", features: ["Unlimited everything", "Unlimited Team", "Custom Integrations", "On-premise option", "SLA Guarantee", "Custom Training", "Account Manager"] },
];

const INVOICES = [
  { id: "INV-2025-07", date: "Jul 1, 2025", amount: 79, status: "paid", plan: "Pro" },
  { id: "INV-2025-06", date: "Jun 1, 2025", amount: 79, status: "paid", plan: "Pro" },
  { id: "INV-2025-05", date: "May 1, 2025", amount: 29, status: "paid", plan: "Starter" },
  { id: "INV-2025-04", date: "Apr 1, 2025", amount: 29, status: "paid", plan: "Starter" },
];

export function BillingPage() {
  const [annual, setAnnual] = useState(false);
  const [tab, setTab] = useState<"overview" | "plans" | "invoices" | "payment">("overview");

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">💳 Billing</h1>
            <p className="text-purple-400 text-sm mt-1">Manage your subscription, payment methods, and invoices</p>
          </div>
        </div>

        <div className="flex gap-1 bg-[#130d2a] border border-purple-900/40 rounded-xl p-1 mb-6 w-fit">
          {([
            { id: "overview", label: "📊 Overview" },
            { id: "plans", label: "💎 Plans" },
            { id: "invoices", label: "🧾 Invoices" },
            { id: "payment", label: "💳 Payment" },
          ] as const).map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === id ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow" : "text-purple-500 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#130d2a] border border-purple-700/40 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-purple-500 uppercase tracking-wider mb-1">Current Plan</p>
                    <h2 className="text-2xl font-black text-white">Pro Plan</h2>
                    <p className="text-purple-400 text-sm mt-1">$79/month · Renews August 1, 2025</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-700 to-indigo-800 rounded-xl px-4 py-2 text-center">
                    <p className="text-xs text-purple-300">Monthly</p>
                    <p className="text-2xl font-black text-white">$79</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "AI Requests Used", value: "12,450 / 50,000", pct: 24 },
                    { label: "Videos Generated", value: "47 / 100", pct: 47 },
                    { label: "Social Accounts", value: "3 / 10", pct: 30 },
                    { label: "Campaigns Active", value: "2 / ∞", pct: 5 },
                  ].map(({ label, value, pct }) => (
                    <div key={label} className="bg-[#0d0920] rounded-xl p-3 border border-purple-900/20">
                      <p className="text-[10px] text-purple-500 mb-1">{label}</p>
                      <p className="text-xs font-bold text-white mb-2">{value}</p>
                      <div className="w-full bg-[#130d2a] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setTab("plans")} className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm">
                    ⬆️ Upgrade to Business
                  </button>
                  <button className="flex-1 bg-[#0d0920] text-purple-300 font-bold py-2.5 rounded-xl text-sm border border-purple-800/40 hover:border-purple-600 transition-all">
                    Manage Plan
                  </button>
                </div>
              </div>

              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Recent Invoices</h3>
                <div className="space-y-2">
                  {INVOICES.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between bg-[#0d0920] rounded-xl p-3 border border-purple-900/20">
                      <div>
                        <p className="text-xs font-semibold text-white">{inv.id}</p>
                        <p className="text-[10px] text-purple-500">{inv.date} · {inv.plan}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">${inv.amount}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 px-2 py-0.5 rounded-full font-mono">paid</span>
                        <button className="text-[10px] text-purple-400 hover:text-white bg-purple-900/20 px-2 py-1 rounded border border-purple-800/30 transition-all">PDF</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">💳 Payment Method</h3>
                <div className="bg-[#0d0920] rounded-xl p-4 border border-purple-900/20 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">💳</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Default</span>
                  </div>
                  <p className="text-sm font-bold text-white">•••• •••• •••• 4242</p>
                  <p className="text-[10px] text-purple-500 mt-1">Visa · Expires 12/2026</p>
                </div>
                <button onClick={() => setTab("payment")} className="w-full text-xs text-purple-300 bg-purple-900/20 py-2 rounded-lg border border-purple-800/30 hover:border-purple-600 font-bold transition-all">
                  + Add Payment Method
                </button>
              </div>

              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">💰 Revenue Share</h3>
                <p className="text-xs text-purple-400 mb-3">Earn 30% recurring commission by referring users to OCTOPUS.</p>
                <div className="bg-[#0d0920] rounded-xl p-3 border border-purple-900/20 mb-3">
                  <p className="text-[10px] text-purple-500">Your referral link</p>
                  <p className="text-xs font-mono text-white mt-1">octopus.ai/ref/yourcode</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-emerald-400">0</p>
                    <p className="text-[10px] text-emerald-600">Referrals</p>
                  </div>
                  <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-2 text-center">
                    <p className="text-lg font-black text-emerald-400">$0</p>
                    <p className="text-[10px] text-emerald-600">Earned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "plans" && (
          <div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className={`text-sm ${!annual ? "text-white font-bold" : "text-purple-500"}`}>Monthly</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={annual} onChange={(e) => setAnnual(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
              <span className={`text-sm ${annual ? "text-white font-bold" : "text-purple-500"}`}>
                Annual <span className="text-emerald-400 text-xs font-bold">-20%</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`bg-[#130d2a] border rounded-xl p-5 relative ${plan.popular ? "border-purple-600/70 shadow-lg shadow-purple-900/30" : "border-purple-900/40"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-base font-black text-white mb-1">{plan.name}</h3>
                  <p className="text-[10px] text-purple-500 mb-4">{plan.desc}</p>
                  <div className="mb-4">
                    {plan.price ? (
                      <>
                        <span className="text-3xl font-black text-white">${annual ? Math.round(plan.price * 0.8) : plan.price}</span>
                        <span className="text-purple-500 text-xs">/mo</span>
                        {annual && <p className="text-[10px] text-emerald-400 mt-0.5">Billed ${Math.round(plan.price * 0.8 * 12)}/year</p>}
                      </>
                    ) : (
                      <span className="text-2xl font-black text-white">Custom</span>
                    )}
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[11px] text-purple-200">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full font-bold py-2.5 rounded-xl text-sm transition-all ${plan.popular ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg" : plan.id === "enterprise" ? "bg-[#0d0920] text-purple-300 border border-purple-800/40 hover:border-purple-600" : "bg-purple-900/40 text-purple-200 hover:bg-purple-800/60 border border-purple-800/30"}`}>
                    {plan.id === "enterprise" ? "Contact Sales" : "Select Plan"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "invoices" && (
          <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-purple-900/40">
                  {["Invoice ID", "Date", "Plan", "Amount", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-purple-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                    <td className="px-4 py-3 font-mono text-white">{inv.id}</td>
                    <td className="px-4 py-3 text-purple-300">{inv.date}</td>
                    <td className="px-4 py-3 text-purple-300">{inv.plan}</td>
                    <td className="px-4 py-3 font-bold text-white">${inv.amount}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 px-2 py-0.5 rounded-full font-mono">{inv.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-[10px] text-purple-400 hover:text-white bg-purple-900/20 px-2 py-1 rounded border border-purple-800/30 transition-all">Download PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "payment" && (
          <div className="max-w-lg">
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Add Payment Method</h3>
              <div className="flex gap-2 mb-4">
                {["💳 Card", "🅿️ PayPal", "💠 Paddle"].map((m) => (
                  <button key={m} className="flex-1 bg-[#0d0920] text-purple-300 text-xs font-bold py-2 rounded-lg border border-purple-800/30 hover:border-purple-600 transition-all">{m}</button>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { label: "Card Number", placeholder: "4242 4242 4242 4242" },
                  { label: "Cardholder Name", placeholder: "Ahmed Al-Rashid" },
                ].map(({ label, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-purple-300 mb-1">{label}</label>
                    <input type="text" placeholder={placeholder} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-purple-300 mb-1">Expiry</label>
                    <input type="text" placeholder="MM/YY" className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-300 mb-1">CVV</label>
                    <input type="password" placeholder="•••" className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3 rounded-xl text-sm">
                  🔐 Add Card Securely
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
