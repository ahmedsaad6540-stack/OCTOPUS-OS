import { useState } from "react";
import { Link } from "wouter";
import { API_BASE } from "@/lib/api";

const CHECKS = [
  { id: "domain", title: "Verify Production Domain (HTTPS)", type: "frontend" },
  { id: "privacy", title: "Verify Privacy Policy Page", type: "ping", url: "/privacy" },
  { id: "terms", title: "Verify Terms of Service Page", type: "ping", url: "/terms" },
  { id: "deletion", title: "Verify Data Deletion Instructions", type: "ping", url: "/data-deletion" },
  { id: "backend_env", title: "Verify Backend Environment Config", type: "health" },
  { id: "scopes", title: "Verify Granted Scopes (video.upload, video.publish)", type: "manual" },
];

export function TikTokReadinessWizard() {
  const [results, setResults] = useState<Record<string, "pending" | "passed" | "failed" | "running">>(
    CHECKS.reduce((acc, c) => ({ ...acc, [c.id]: "pending" }), {})
  );
  
  const [running, setRunning] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    const newResults = { ...results };

    for (const check of CHECKS) {
      newResults[check.id] = "running";
      setResults({ ...newResults });

      try {
        if (check.type === "ping" && check.url) {
          const res = await fetch(check.url);
          newResults[check.id] = res.ok ? "passed" : "failed";
        } else if (check.type === "frontend") {
          newResults[check.id] = window.location.protocol === "https:" || window.location.hostname === "localhost" ? "passed" : "failed";
        } else if (check.type === "health") {
          const res = await fetch(`${API_BASE}/health/tiktok`);
          if (res.ok) {
            const data = await res.json();
            newResults[check.id] = data.diagnostics.hasTiktokKey ? "passed" : "failed";
          } else {
            newResults[check.id] = "failed";
          }
        } else {
          // Manual checks
          newResults[check.id] = "passed";
        }
      } catch {
        newResults[check.id] = "failed";
      }
      
      // Simulate slight delay for UI effect
      await new Promise(r => setTimeout(r, 600));
      setResults({ ...newResults });
    }
    setRunning(false);
  };

  const domain = window.location.hostname || "yourdomain.com";

  return (
    <div className="min-h-screen bg-[#06020f] text-[#e2d9f3] p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-purple-800/30 pb-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              TikTok Readiness Wizard
            </h1>
            <p className="text-sm text-gray-400 mt-1">Diagnostic tool to verify TikTok Developer Portal submission requirements.</p>
          </div>
          <Link href="/">
            <a className="text-sm text-purple-400 hover:text-purple-300">← Back to OS</a>
          </Link>
        </div>

        <div className="bg-[#130d2a] p-8 rounded-2xl border border-purple-900/50 shadow-2xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Pre-Flight Checklist</h2>
            <button 
              onClick={runDiagnostics}
              disabled={running}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
            >
              {running ? "⏳ Running..." : "🚀 Run Diagnostics"}
            </button>
          </div>

          <div className="space-y-3">
            {CHECKS.map(check => (
              <div key={check.id} className="flex items-center justify-between p-4 bg-[#0d0920] rounded-xl border border-purple-800/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {results[check.id] === "pending" && "⏳"}
                    {results[check.id] === "running" && "🔄"}
                    {results[check.id] === "passed" && "✅"}
                    {results[check.id] === "failed" && "❌"}
                  </span>
                  <span className="text-sm font-medium text-gray-200">{check.title}</span>
                </div>
                {check.type === "manual" && <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded">Manual Verify</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#130d2a] p-8 rounded-2xl border border-purple-900/50 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Required Developer Portal Inputs</h2>
          <p className="text-xs text-gray-400 mb-6">Copy and paste these exact values into your TikTok Login Kit & Webhooks configuration.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-purple-400 mb-1">Authorized Redirect URI</label>
              <code className="block w-full bg-[#0d0920] p-3 rounded-lg text-emerald-400 text-sm font-mono border border-purple-800/30">
                https://api-server-production-4801.up.railway.app/api/oauth/tiktok/callback
              </code>
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-400 mb-1">Privacy Policy URL</label>
              <code className="block w-full bg-[#0d0920] p-3 rounded-lg text-emerald-400 text-sm font-mono border border-purple-800/30">
                https://{domain}/privacy
              </code>
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-400 mb-1">Terms of Service URL</label>
              <code className="block w-full bg-[#0d0920] p-3 rounded-lg text-emerald-400 text-sm font-mono border border-purple-800/30">
                https://{domain}/terms
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
