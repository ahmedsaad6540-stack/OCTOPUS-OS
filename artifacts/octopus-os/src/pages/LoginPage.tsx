import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("admin@octopus.ai");
  const [password, setPassword] = useState("octopus123");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    try {
      if (mode === "signup") {
        const res = await fetch(`${BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) { setError("Registration failed."); setLoading(false); return; }
      }
      const ok = await login(email, password);
      if (!ok) setError("Invalid credentials.");
    } catch { setError("Connection error."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0614" }}>
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🐙</div>
        <h1 className="text-3xl font-bold">
          <span className="text-white">OCTOPUS </span>
          <span className="text-purple-400">NEXUS</span>
        </h1>
        <p className="text-purple-300/60 text-xs tracking-widest mt-1">BUSINESS OPERATING SYSTEM v7</p>
      </div>

      <div className="w-full max-w-md card-os p-8">
        <div className="flex mb-6 p-1 rounded-lg" style={{ background: "#0d0920" }}>
          {(["signin", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === m ? "gradient-purple text-white shadow" : "text-purple-400 hover:text-purple-300"}`}>
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs text-purple-400 mb-1 block">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name"
                className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none transition-all"
                style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.25)" }} required />
            </div>
          )}
          <div>
            <label className="text-xs text-purple-400 mb-1 block">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@octopus.ai"
              className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none"
              style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.25)" }} required />
          </div>
          <div>
            <label className="text-xs text-purple-400 mb-1 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none"
              style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.25)" }} required />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white gradient-purple glow-purple transition-all hover:opacity-90 disabled:opacity-50 mt-2">
            {loading ? "⏳ Loading..." : "🚀 Enter Command Center"}
          </button>
        </form>

        <div className="flex justify-around mt-6 pt-4" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
          {[["🤖", "10 Agents"], ["📊", "Real Analytics"], ["🔄", "Full Automation"]].map(([icon, label]) => (
            <div key={label} className="text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-xs text-purple-400/60">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
