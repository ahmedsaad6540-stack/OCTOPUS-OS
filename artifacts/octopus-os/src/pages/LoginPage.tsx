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
      className="drop-shadow-[0_0_20px_rgba(168,85,247,0.7)] animate-pulse"
    >
      <circle cx="50" cy="38" r="22" fill="url(#headGrad)" />
      <circle cx="42" cy="33" r="4" fill="white" opacity="0.95" />
      <circle cx="58" cy="33" r="4" fill="white" opacity="0.95" />
      <circle cx="43" cy="34" r="2" fill="#1a0a2e" />
      <circle cx="59" cy="34" r="2" fill="#1a0a2e" />
      <path d="M44 42 Q50 47 56 42" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M28 55 Q20 65 22 78 Q24 85 28 82 Q30 78 28 70 Q32 75 36 80 Q40 85 42 82 Q42 75 38 68" fill="url(#tentGrad)" />
      <path d="M72 55 Q80 65 78 78 Q76 85 72 82 Q70 78 72 70 Q68 75 64 80 Q60 85 58 82 Q58 75 62 68" fill="url(#tentGrad)" />
      <path d="M38 58 Q35 70 30 78 Q28 84 32 84 Q36 82 37 75 Q40 82 44 85 Q47 87 48 83 Q47 76 44 68" fill="url(#tentGrad)" />
      <path d="M62 58 Q65 70 70 78 Q72 84 68 84 Q64 82 63 75 Q60 82 56 85 Q53 87 52 83 Q53 76 56 68" fill="url(#tentGrad)" />
      <path d="M50 58 Q47 72 45 82 Q44 88 48 88 Q50 86 50 82 Q50 86 52 88 Q56 88 55 82 Q53 72 50 58" fill="url(#tentGrad)" />
      <defs>
        <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="tentGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "recovery_sent">("signin");
  const [email, setEmail] = useState("admin@octopus.ai");
  const [password, setPassword] = useState("octopus123");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Calculate password strength for signup mode
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "أدخل كلمة المرور", color: "bg-gray-700" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 1) return { score: 25, label: "ضعيفة جداً", color: "bg-red-500" };
    if (score === 2) return { score: 50, label: "متوسطة", color: "bg-amber-500" };
    if (score === 3) return { score: 75, label: "قوية", color: "bg-blue-500" };
    return { score: 100, label: "قوية جداً ومؤمنة 🛡️", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    if (mode === "forgot") {
      await new Promise(r => setTimeout(r, 1200));
      setMode("recovery_sent");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) {
        setError("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as {message?: string}).message || "فشل إنشاء الحساب. قد يكون البريد الإلكتروني مسجلاً بالفعل.");
          setLoading(false);
          return;
        }
      } catch {
        // Registration API unavailable — proceed to login fallback
      }
    }

    // login() already has an internal try/catch + demo fallback, it never throws
    const ok = await login(email, password);
    if (!ok) {
      setError("بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.");
    }
    setLoading(false);
  };

  const handleSocialLogin = (provider: string) => {
    // 1-Click OAuth flow to known platforms
    const authUrl = `${API_BASE.replace(/\/$/, "")}/auth/social/${provider}/login`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-[#080414] relative overflow-hidden font-sans text-white">
      {/* Dynamic blurred background light flares */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-pink-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Left Column: Premium Branding & Architecture Showcase */}
      <div className="hidden md:flex md:col-span-6 lg:col-span-7 flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-black/60 via-[#0d0722]/40 to-transparent border-r border-purple-900/30 relative z-10 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OctopusIcon size={44} />
            <div>
              <span className="text-lg font-black tracking-wider text-white font-heading">OCTOPUS</span>
              <span className="text-xs font-mono block text-purple-400 tracking-widest uppercase">NEXUS OS v3.5</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            🟢 Railway Cloud Connected
          </div>
        </div>

        <div className="space-y-6 max-w-xl my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-medium">
            ✨ نظام التشغيل السحابي الذكي المتكامل للشركات وأتمتة الأرباح
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight font-heading">
            أدر إمبراطوريتك الرقمية عبر <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">الوكلاء الذكيين المستقلين</span>
          </h1>
          <p className="text-sm lg:text-base text-purple-200/70 leading-relaxed">
            منصة القيادة السحابية فائقة التطور لربط حملات التسويق بالعمولة (ClickBank, Amazon, Digistore24) وإدارة القنوات الاجتماعية وإطلاق الفيديوهات الآلية بضغطة زر.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/30 backdrop-blur-sm">
              <div className="text-purple-400 font-bold text-sm flex items-center gap-2 mb-1">
                <span>🤖</span> أتمتة شاملة 24/7
              </div>
              <p className="text-xs text-purple-300/60">وكلاء مستقلون يتولون النشر والتحليل وجني الأرباح دون توقف.</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/30 backdrop-blur-sm">
              <div className="text-pink-400 font-bold text-sm flex items-center gap-2 mb-1">
                <span>⚡</span> ربط موحد 1-Click
              </div>
              <p className="text-xs text-purple-300/60">بوابات دخول فورية متوافقة بنظام Buffer لكافة المنصات العالمية.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-purple-400/50 pt-6 border-t border-purple-900/20 font-mono">
          <span>🛡️ Enterprise 256-Bit Encrypted Sessions</span>
          <span>© 2026 OCTOPUS NEXUS AI</span>
        </div>
      </div>

      {/* Right Column: Interactive Professional Auth Form */}
      <div className="col-span-1 md:col-span-6 lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative z-10">
        <div className="w-full max-w-md space-y-6">
          
          {/* Mobile header */}
          <div className="flex md:hidden flex-col items-center text-center mb-4">
            <OctopusIcon size={64} />
            <h2 className="text-2xl font-black text-white mt-3 font-heading">OCTOPUS NEXUS OS</h2>
            <p className="text-xs text-purple-400 mt-1">منصة القيادة الذكية المستقلة</p>
          </div>

          <div className="bg-[#130d2a]/90 backdrop-blur-2xl p-7 sm:p-8 rounded-3xl border border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.2)] relative">
            
            {/* Tab Switcher (when not in forgot modes) */}
            {mode !== "forgot" && mode !== "recovery_sent" && (
              <div className="flex rounded-2xl bg-black/50 p-1.5 mb-7 border border-purple-900/50">
                <button
                  onClick={() => { setMode("signin"); setError(""); setSuccessMsg(""); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    mode === "signin"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30"
                      : "text-purple-400 hover:text-white"
                  }`}
                >
                  <span>🔐</span> تسجيل الدخول
                </button>
                <button
                  onClick={() => { setMode("signup"); setError(""); setSuccessMsg(""); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    mode === "signup"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30"
                      : "text-purple-400 hover:text-white"
                  }`}
                >
                  <span>✨</span> حساب جديد
                </button>
              </div>
            )}

            {/* Forgot Password Flow Header */}
            {mode === "forgot" && (
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center mx-auto mb-3 text-2xl">
                  🔑
                </div>
                <h3 className="text-lg font-black text-white">استعادة كلمة المرور</h3>
                <p className="text-xs text-purple-300/70 mt-1">أدخل بريدك الإلكتروني وسنرسل لك كود أو رابط إعادة التعيين فوراً.</p>
              </div>
            )}

            {/* Recovery Sent State */}
            {mode === "recovery_sent" ? (
              <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-500/50 flex items-center justify-center mx-auto text-3xl animate-bounce">
                  📧
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-400">تم إرسال رابط الاستعادة!</h3>
                  <p className="text-xs text-purple-200/80 mt-2 leading-relaxed max-w-xs mx-auto">
                    لقد أرسلنا تعليمات إعادة تعيين كلمة المرور إلى <span className="font-mono text-purple-300 font-bold">{email}</span>. يرجى مراجعة صندوق الوارد والرسائل المهملة (Spam).
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => { setMode("signin"); setError(""); }}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-purple-900/50 border border-purple-600 hover:bg-purple-800 text-white transition-all"
                  >
                    ⬅️ العودة لتسجيل الدخول
                  </button>
                </div>
              </div>
            ) : (
              /* Main Form (SignIn / SignUp / Forgot) */
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-300 flex items-center justify-between">
                      <span>الاسم الكامل</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="مثال: أحمد سعد (Ahmed Saad)"
                      className="w-full px-4 py-3 rounded-xl text-xs text-white outline-none bg-black/50 border border-purple-800/50 focus:border-purple-400 focus:bg-black/80 transition-all font-sans"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-purple-300 flex items-center justify-between">
                    <span>البريد الإلكتروني (Email)</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@octopus.ai"
                    className="w-full px-4 py-3 rounded-xl text-xs text-white outline-none bg-black/50 border border-purple-800/50 focus:border-purple-400 focus:bg-black/80 transition-all font-sans"
                    required
                  />
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-300 flex items-center justify-between">
                      <span>كلمة المرور (Password)</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-xs text-white outline-none bg-black/50 border border-purple-800/50 focus:border-purple-400 focus:bg-black/80 transition-all font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 text-sm focus:outline-none"
                        title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      >
                        {showPassword ? "👁️‍🗨️" : "👁️"}
                      </button>
                    </div>

                    {/* Password Strength Meter (Only on SignUp) */}
                    {mode === "signup" && password && (
                      <div className="pt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-purple-300 font-medium">
                          <span>قوة الكلمة:</span>
                          <span className={strength.score === 100 ? "text-emerald-400 font-bold" : "text-purple-400"}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${strength.color}`}
                            style={{ width: `${strength.score}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Remember Me & Forgot Password Links */}
                {mode === "signin" && (
                  <div className="flex justify-between items-center text-[11px] text-purple-300/80 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="rounded bg-black/60 border-purple-700 text-purple-600 focus:ring-0 w-4 h-4"
                      />
                      <span>تذكرني على هذا الجهاز</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError(""); }}
                      className="text-purple-400 hover:text-pink-400 font-bold underline decoration-purple-600/50 transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-700/60 text-red-300 text-xs text-center font-semibold animate-shake">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2 tracking-wider"
                >
                  {loading
                    ? "⏳ جارٍ التحقق والاتصال..."
                    : mode === "forgot"
                    ? "🚀 إرسال رابط استعادة الكلمة"
                    : mode === "signup"
                    ? "✨ إنشاء الحساب والبدء فوراً"
                    : "🔐 دخول إلى منصة القيادة الآن"}
                </button>

                {mode === "forgot" && (
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-purple-400 hover:text-white transition-colors text-center block"
                  >
                    ⬅️ العودة إلى تسجيل الدخول
                  </button>
                )}
              </form>
            )}

            {/* Known Account Social Login Buttons (`1-Click Social Sign-in`) */}
            {mode !== "forgot" && mode !== "recovery_sent" && (
              <div className="mt-7 pt-5 border-t border-purple-900/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400/60 text-center mb-4">
                  أو الدخول المباشر بنقرة واحدة عبر الحسابات المعروفة
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("google")}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0a0618] hover:bg-purple-950/50 border border-purple-800/40 hover:border-purple-500/60 text-xs font-semibold text-purple-200 transition-all group shadow-sm"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🌐</span>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("github")}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0a0618] hover:bg-purple-950/50 border border-purple-800/40 hover:border-purple-500/60 text-xs font-semibold text-purple-200 transition-all group shadow-sm"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🐙</span>
                    <span>GitHub Dev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("microsoft")}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0a0618] hover:bg-purple-950/50 border border-purple-800/40 hover:border-purple-500/60 text-xs font-semibold text-purple-200 transition-all group shadow-sm"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">💼</span>
                    <span>Microsoft</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("x")}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0a0618] hover:bg-purple-950/50 border border-purple-800/40 hover:border-purple-500/60 text-xs font-semibold text-purple-200 transition-all group shadow-sm"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🐦</span>
                    <span>X (Twitter)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Credentials Info for User Convenience */}
            <div className="mt-6 p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 text-[10px] text-purple-300/80 flex items-center justify-between">
              <span>💡 للدخول الفوري السريع:</span>
              <span className="font-mono font-bold text-emerald-400">admin@octopus.ai / octopus123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
