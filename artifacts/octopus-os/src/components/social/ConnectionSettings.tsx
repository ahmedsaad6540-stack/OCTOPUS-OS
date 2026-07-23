import React from "react";
import { useLocation } from "wouter";

interface ConnectionSettingsProps {
  platform: any;
  selected: string;
  testConn: () => void;
  testing: boolean;
  disconnect: () => void;
  connect: () => void;
  saving: boolean;
  autoConnect: () => void;
  autoConnecting: boolean;
  testMsg: string;
  saveMsg: string;
  fields: string[];
  values: Record<string, Record<string, string>>;
  setVal: (field: string, val: string) => void;
  saveConfig: () => void;
  domain: string;
}

export function ConnectionSettings({
  platform,
  selected,
  testConn,
  testing,
  disconnect,
  connect,
  saving,
  autoConnect,
  autoConnecting,
  testMsg,
  saveMsg,
  fields,
  values,
  setVal,
  saveConfig,
  domain,
}: ConnectionSettingsProps) {
  const [, setLocation] = useLocation();
  const redirectUri = `https://${domain}/oauth/${selected}/callback`;

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{platform.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-white">{platform.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${["CONNECTED", "LIVE_VERIFIED"].includes(platform.status) ? "bg-emerald-400" : "bg-gray-600"}`}></span>
              <span className={`text-xs ${["CONNECTED", "LIVE_VERIFIED"].includes(platform.status) ? "text-emerald-400" : "text-gray-500"}`}>
                {platform.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={testConn} disabled={testing}
            className="px-3 py-2 rounded-lg text-xs text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all">
            {testing ? "⟳ Testing..." : "🧪 Test Connection"}
          </button>
          {platform.status !== "NOT_CONFIGURED" ? (
            <button onClick={disconnect} disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all bg-red-900/50 text-red-400 border border-red-500/30">
              {saving ? "⟳ Disconnecting..." : "🔌 Disconnect"}
            </button>
          ) : (
            <button onClick={connect} disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all gradient-purple text-white glow-purple">
              {saving ? "⟳ Connecting..." : "🔗 Connect"}
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <button
          onClick={autoConnect}
          disabled={autoConnecting}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-700/90 to-cyan-700/90 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-3.5 px-6 rounded-xl text-xs border border-emerald-500/60 transition-all text-center shadow-[0_0_20px_rgba(16,185,129,0.3)] w-full"
        >
          {autoConnecting ? "⟳ جاري الربط التلقائي..." : "⚡ ربط جميع المنصات تلقائياً (ضغطة واحدة)"}
        </button>
        {["CONNECTED", "LIVE_VERIFIED"].includes(platform.status) && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900/30 border border-emerald-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold">✅ {platform.name} متصل ومفعّل</span>
          </div>
        )}
        <div className="flex items-center my-1">
          <div className="flex-1 border-t border-purple-950/50" />
          <span className="px-2 text-[9px] text-purple-600 uppercase font-bold tracking-wider">أو الإعداد اليدوي أدناه</span>
          <div className="flex-1 border-t border-purple-950/50" />
        </div>
      </div>

      {testMsg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-xs ${testMsg.includes("✅") ? "bg-emerald-900/20 text-emerald-400 border border-emerald-500/20" : "bg-red-900/20 text-red-400 border border-red-500/20"}`}>
          {testMsg}
        </div>
      )}

      {saveMsg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-xs ${saveMsg.includes("✅") ? "bg-emerald-900/20 text-emerald-400 border border-emerald-500/20" : "bg-red-900/20 text-red-400 border border-red-500/20"}`}>
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        {fields.filter(Boolean).map(field => (
          <div key={field}>
            <label className="text-xs text-purple-400 mb-1 block">{field}</label>
            <input
              type={field.toLowerCase().includes("secret") || field.toLowerCase().includes("token") || field.toLowerCase().includes("password") ? "password" : "text"}
              value={values[selected]?.[field] || ""}
              onChange={e => setVal(field, e.target.value)}
              placeholder={`Enter ${field.toLowerCase()}...`}
              className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none transition-all"
              style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.2)" }}
            />
          </div>
        ))}
      </div>

      <button onClick={saveConfig} disabled={saving}
        className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple">
        {saving ? "⟳ Saving..." : "💾 Save Configuration"}
      </button>

      {/* OAuth URI */}
      <div className="mt-6 card-os p-4">
        <h3 className="text-xs font-bold text-purple-300 mb-3">🔗 OAuth URIs (auto-generated)</h3>
        <div className="space-y-2">
          {[["Redirect URI", redirectUri], ["Callback URL", `https://${domain}/oauth/${selected}/callback`],
            ["Webhook URL", `https://${domain}/webhook/${selected}`]].map(([label, val]) => (
            <div key={label}>
              <div className="text-[10px] text-purple-400/60 mb-1">{label}</div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.15)" }}>
                <code className="text-xs text-purple-300 flex-1 break-all">{val}</code>
                <button onClick={() => navigator.clipboard.writeText(val)}
                  className="text-purple-400 hover:text-purple-300 text-xs shrink-0">📋</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Navigation Bar */}
      <div className="mt-10 border-t border-purple-900/30 pt-6 flex justify-between items-center bg-black/20 p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">الخطوة التالية (Next Step)</h3>
          <p className="text-xs text-purple-400">بعد ربط حسابات النشر بنجاح، أنت جاهز لإنشاء حملتك التسويقية الأولى.</p>
        </div>
        <button 
          onClick={() => setLocation("/campaigns")}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all transform hover:scale-105">
          الذهاب إلى Campaigns ➡️
        </button>
      </div>
    </div>
  );
}
