import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";

function OctopusIcon({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_0_15px_rgba(124,58,237,0.6)] animate-pulse"
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
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="tentGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("admin@octopus.ai");
  const [password, setPassword] = useState("octopus123");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
          setError("Registration failed.");
          setLoading(false);
          return;
        }
      }
      const ok = await login(email, password);
      if (!ok) setError("Invalid credentials.");
    } catch {
      setError("Connection error.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#06020f] relative overflow-hidden font-sans">
      
      {/* Decorative blurred background shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      {/* Left Column: AI OS Branding */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-black/25 border-r border-purple-950/40 relative z-10 select-none">
        <div className="text-center space-y-6 max-w-sm">
          <div className="inline-flex items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-purple-950/30 to-indigo-950/30 border border-purple-500/15 shadow-2xl">
            <OctopusIcon size={84} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white font-heading">
              OCTOPUS <span className="text-gradient">NEXUS OS</span>
            </h1>
            <p className="text-purple-400/60 font-mono text-xs tracking-widest uppercase mt-2">
              Autonomous AI Operating System
            </p>
          </div>
          <p className="text-xs text-purple-300/60 leading-relaxed font-sans">
            A next-generation business operating environment powered by autonomous virtual agents, real-time telemetry, and multi-channel campaign automation.
          </p>
        </div>
      </div>

      {/* Right Column: Auth Forms */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo badge for mobile view */}
          <div className="flex md:hidden flex-col items-center text-center">
            <OctopusIcon size={64} />
            <h2 className="text-xl font-bold text-white mt-3 font-heading">OCTOPUS NEXUS OS</h2>
          </div>

          <div className="glass p-8 rounded-2xl border border-purple-500/15 shadow-2xl relative">
            <div className="flex rounded-xl bg-black/40 p-1 mb-6 border border-purple-950">
              <button onClick={() => { setMode("signin"); setError(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === "signin"
                    ? "gradient-purple text-white shadow-lg glow-purple"
                    : "text-purple-400 hover:text-white"
                }`}>
                Sign In
              </button>
              <button onClick={() => { setMode("signup"); setError(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === "signup"
                    ? "gradient-purple text-white shadow-lg glow-purple"
                    : "text-purple-400 hover:text-white"
                }`}>
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ahmed Saad"
                    className="w-full px-4 py-3 rounded-xl text-xs text-white outline-none bg-black/40 border border-purple-800/30 focus:border-purple-400 transition-all font-sans" required />
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@octopus.ai"
                  className="w-full px-4 py-3 rounded-xl text-xs text-white outline-none bg-black/40 border border-purple-800/30 focus:border-purple-400 transition-all font-sans" required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-xs text-white outline-none bg-black/40 border border-purple-800/30 focus:border-purple-400 transition-all font-sans" required />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex justify-between items-center text-[10px] text-purple-300/80 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="rounded bg-black/60 border-purple-800 text-purple-600 focus:ring-0 focus:ring-offset-0" />
                  Remember Me
                </label>
                <button type="button" className="hover:text-purple-200">Forgot Password?</button>
              </div>

              {error && <p className="text-red-400 text-xs text-center font-semibold">⚠️ {error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs text-white gradient-purple glow-purple transition-all hover:opacity-90 disabled:opacity-50 mt-4 uppercase tracking-wider">
                {loading ? "⏳ Accessing Core..." : "🔐 Enter Command Center"}
              </button>
            </form>

            {/* Social logins / Placeholders */}
            <div className="mt-6 pt-4 border-t border-purple-950/60 text-center space-y-3">
              <span className="text-[9px] uppercase tracking-widest text-purple-500/50">Or authenticate via</span>
              <div className="flex gap-2 justify-center">
                {["Google", "Github", "Replit"].map(provider => (
                  <button key={provider} type="button"
                    className="px-4 py-2 rounded-lg text-[10px] font-bold bg-[#0d0920] border border-purple-500/10 text-purple-300 hover:text-white hover:border-purple-500/25 transition-all">
                    {provider}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
