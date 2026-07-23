import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function AffiliatesCallbackPage() {
  const { token } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState("Verifying authorization...");

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams(window.location.search);
    const state = params.get("state");
    const request_token = params.get("request_token");

    if (!state || !request_token) {
      setStatus("❌ Invalid callback parameters");
      setTimeout(() => navigate("/affiliates"), 3000);
      return;
    }

    const verifyCallback = async () => {
      try {
        const res = await fetch(`${API_BASE}/affiliate/connections/digistore24/callback?state=${state}&request_token=${request_token}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("✅ Authorization successful. Redirecting...");
          setTimeout(() => navigate("/affiliates"), 1500);
        } else {
          setStatus(`❌ Authorization failed: ${data.error || "Unknown error"}`);
          setTimeout(() => navigate("/affiliates"), 3000);
        }
      } catch (err) {
        setStatus("❌ Communication error during authorization.");
        setTimeout(() => navigate("/affiliates"), 3000);
      }
    };

    verifyCallback();
  }, [token, navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#06020f] font-sans">
      <div className="glass-card p-8 rounded-xl border border-purple-900/30 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Digistore24 Interactive API-Key Authorization</h1>
        <p className="text-purple-300">{status}</p>
      </div>
    </div>
  );
}
