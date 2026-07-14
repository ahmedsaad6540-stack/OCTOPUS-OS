import { useState } from "react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/__mockup.*/, "") + "/api";

type AuthMode = "login" | "register";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem("octopus_token");
      const user = localStorage.getItem("octopus_user");
      return { token, user: user ? (JSON.parse(user) as User) : null };
    } catch {
      return { token: null, user: null };
    }
  });

  const login = (user: User, token: string) => {
    localStorage.setItem("octopus_token", token);
    localStorage.setItem("octopus_user", JSON.stringify(user));
    setAuth({ user, token });
  };

  const logout = () => {
    localStorage.removeItem("octopus_token");
    localStorage.removeItem("octopus_user");
    setAuth({ user: null, token: null });
  };

  return { auth, login, logout };
}

function OctopusIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="38" r="22" fill="url(#headGrad)" />
      <circle cx="42" cy="33" r="4" fill="white" opacity="0.9" />
      <circle cx="58" cy="33" r="4" fill="white" opacity="0.9" />
      <circle cx="43" cy="34" r="2" fill="#1a0a2e" />
      <circle cx="59" cy="34" r="2" fill="#1a0a2e" />
      <path d="M44 42 Q50 47 56 42" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M28 55 Q20 65 22 78 Q24 85 28 82 Q30 78 28 70 Q32 75 36 80 Q40 85 42 82 Q42 75 38 68" fill="url(#tentGrad)" />
      <path d="M72 55 Q80 65 78 78 Q76 85 72 82 Q70 78 72 70 Q68 75 64 80 Q60 85 58 82 Q58 75 62 68" fill="url(#tentGrad)" />
      <path d="M38 58 Q35 70 30 78 Q28 84 32 84 Q36 82 37 75 Q40 82 44 85 Q47 87 48 83 Q47 76 44 68" fill="url(#tentGrad)" />
      <path d="M62 58 Q65 70 70 78 Q72 84 68 84 Q64 82 63 75 Q60 82 56 85 Q53 87 52 83 Q53 76 56 68" fill="url(#tentGrad)" />
      <path d="M50 58 Q47 72 45 82 Q44 88 48 88 Q50 86 50 82 Q50 86 52 88 Q56 88 55 82 Q53 72 50 58" fill="url(#tentGrad)" />
      <defs>
        <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="tentGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Dashboard({ user, logout }: { user: User; logout: () => void }) {
  const agents = [
    { name: "Brain", icon: "🧠", status: "online", tasks: 3 },
    { name: "Creator", icon: "🎬", status: "idle", tasks: 0 },
    { name: "Publisher", icon: "📢", status: "online", tasks: 7 },
    { name: "Tracker", icon: "👁", status: "online", tasks: 12 },
    { name: "Optimizer", icon: "⚡", status: "idle", tasks: 0 },
    { name: "Money", icon: "💰", status: "online", tasks: 2 },
    { name: "Competitor", icon: "🕵", status: "idle", tasks: 0 },
    { name: "TrendHunter", icon: "🔥", status: "online", tasks: 5 },
    { name: "Lab", icon: "🧪", status: "idle", tasks: 0 },
    { name: "CEO", icon: "👔", status: "online", tasks: 1 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0614] text-white">
      <nav className="border-b border-purple-900/40 bg-[#0d0920]/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <OctopusIcon size={32} />
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              OCTOPUS NEXUS OS
            </span>
            <span className="ml-2 text-xs text-purple-500 font-mono">v5 GENIUS</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-purple-400">{user.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-sm font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="text-xs text-purple-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-purple-800/50 hover:border-purple-600"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            🖥️ Command Center
          </h1>
          <p className="text-purple-400 text-sm">
            Good morning, {user.name.split(" ")[0]}. Your OS is running.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Revenue", value: "$0.00", icon: "💰", change: "+0%" },
            { label: "Active Campaigns", value: "0", icon: "📣", change: "Ready" },
            { label: "Agents Online", value: `${agents.filter(a => a.status === "online").length}/10`, icon: "🤖", change: "Active" },
            { label: "Tasks Queued", value: `${agents.reduce((sum, a) => sum + a.tasks, 0)}`, icon: "⚡", change: "Running" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4 hover:border-purple-700/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-xs text-purple-500 font-mono">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-purple-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <span>🤖</span> AI Agents
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {agents.map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between bg-[#0d0920] rounded-lg px-3 py-2.5 border border-purple-900/20 hover:border-purple-700/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{agent.icon}</span>
                      <span className="text-sm font-medium text-white">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.tasks > 0 && (
                        <span className="text-xs bg-purple-800/50 text-purple-300 px-1.5 py-0.5 rounded-full font-mono">
                          {agent.tasks}
                        </span>
                      )}
                      <div
                        className={`w-2 h-2 rounded-full ${
                          agent.status === "online"
                            ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                            : "bg-gray-600"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 mb-4">
              <h2 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <span>👔</span> AI CEO Report
              </h2>
              <div className="space-y-3">
                <div className="bg-[#0d0920] rounded-lg p-3 border border-purple-900/20">
                  <p className="text-xs text-purple-400 mb-1">Today's Mission</p>
                  <p className="text-sm text-white">System initialized. Awaiting first campaign.</p>
                </div>
                <div className="bg-[#0d0920] rounded-lg p-3 border border-purple-900/20">
                  <p className="text-xs text-purple-400 mb-1">Recommendation</p>
                  <p className="text-sm text-white">Connect your first affiliate network to begin.</p>
                </div>
                <button className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all">
                  🚀 Start Autonomous Mode
                </button>
              </div>
            </div>

            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <span>⚡</span> System Status
              </h2>
              {[
                { label: "Backend", status: true },
                { label: "Database", status: true },
                { label: "Auth", status: true },
                { label: "AI Providers", status: false },
                { label: "Social Links", status: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-xs text-purple-300">{item.label}</span>
                  <span
                    className={`text-xs font-mono ${
                      item.status ? "text-emerald-400" : "text-gray-500"
                    }`}
                  >
                    {item.status ? "● Online" : "○ Not configured"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OctopusLogin() {
  const { auth, login, logout } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (auth.user && auth.token) {
    return <Dashboard user={auth.user} logout={logout} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { email: form.email, password: form.password, name: form.name };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as {
        user?: User;
        token?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Something went wrong");
        return;
      }

      if (data.user && data.token) {
        login(data.user, data.token);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0614] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-950/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 mb-4 shadow-2xl shadow-purple-900/50">
            <OctopusIcon size={48} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            OCTOPUS NEXUS OS
          </h1>
          <p className="text-purple-400 text-sm mt-1 font-mono">v5 GENIUS</p>
        </div>

        <div className="bg-[#130d2a]/80 backdrop-blur-xl border border-purple-800/40 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="flex rounded-xl bg-[#0d0920] p-1 mb-6">
            <button
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg"
                  : "text-purple-400 hover:text-white"
              }`}
              onClick={() => { setMode("login"); setError(null); }}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === "register"
                  ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg"
                  : "text-purple-400 hover:text-white"
              }`}
              onClick={() => { setMode("register"); setError(null); }}
            >
              Register
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ahmed Al-Rashid"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-4 py-3 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@octopus.ai"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-4 py-3 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder={mode === "register" ? "Min 8 characters" : "••••••••"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-4 py-3 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:from-purple-900 disabled:to-indigo-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/40 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? (
                "🔐 Enter Command Center"
              ) : (
                "🚀 Launch OCTOPUS"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-purple-900/30 text-center">
            <p className="text-xs text-purple-600">
              Business Operating System for Digital Entrepreneurs
            </p>
            <div className="flex items-center justify-center gap-4 mt-3">
              {["🧠 AI Agents", "📊 Analytics", "🔄 Automation"].map((item) => (
                <span key={item} className="text-xs text-purple-700 font-mono">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-purple-800 mt-6">
          OCTOPUS NEXUS OS — Powered by AI
        </p>
      </div>
    </div>
  );
}
