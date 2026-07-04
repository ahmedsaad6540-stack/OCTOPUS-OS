import { useState } from "react";
import { useAuth } from "@/lib/auth";

type Mode = "login" | "register";

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <label className="block text-xs font-medium text-purple-300 mb-1.5">{label}</label>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-4 py-3 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0614] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 mb-5 shadow-2xl shadow-purple-900/60 text-4xl">
            🐙
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            OCTOPUS<span className="text-purple-500"> NEXUS</span>
          </h1>
          <p className="text-purple-400 text-sm mt-1 font-mono tracking-widest">
            BUSINESS OPERATING SYSTEM
          </p>
        </div>

        <div className="bg-[#130d2a]/90 backdrop-blur-xl border border-purple-800/40 rounded-2xl p-8 shadow-2xl shadow-black/60">
          <div className="flex rounded-xl bg-[#0d0920] p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg capitalize transition-all ${
                  mode === m
                    ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg"
                    : "text-purple-500 hover:text-white"
                }`}
                onClick={() => { setMode(m); setError(null); }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {mode === "register" && field("Full Name", "name", "text", "Ahmed Al-Rashid")}
            {field("Email Address", "email", "email", "you@octopus.ai")}
            {field("Password", "password", "password", mode === "register" ? "Min 8 characters" : "••••••••")}

            {error && (
              <div className="bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/40 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === "login" ? "Signing in..." : "Launching OS..."}
                </>
              ) : mode === "login" ? "🚀 Enter Command Center" : "🐙 Launch OCTOPUS OS"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-purple-900/30 grid grid-cols-3 gap-2 text-center">
            {[["🤖", "10 Agents"], ["📊", "Real Analytics"], ["🔄", "Full Automation"]].map(([icon, label]) => (
              <div key={label} className="bg-[#0d0920] rounded-lg py-2 px-1">
                <p className="text-lg">{icon}</p>
                <p className="text-[10px] text-purple-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
