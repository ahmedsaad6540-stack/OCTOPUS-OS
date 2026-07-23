import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/lib/api";

export interface ProviderRecord {
  id: string;
  providerName: string;
  displayName: string;
  status: string;
  followers?: string;
  connectionSource?: string;
}

export function useSocialAccounts(token: string | null, PLATFORMS: any[]) {
  const [connectedMap, setConnectedMap] = useState<Record<string, ProviderRecord>>({});
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [autoConnecting, setAutoConnecting] = useState(false);

  const fetchSocialAccounts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/social`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const accounts = data.accounts || data || [];
        const map: Record<string, ProviderRecord> = {};
        for (const p of accounts) {
          const platformId = PLATFORMS.find(
            (pl: any) =>
              pl.id === p.platform?.toLowerCase() ||
              pl.name.toLowerCase() === p.platform?.toLowerCase()
          )?.id;
          if (platformId) {
            map[platformId] = { ...p, providerName: p.platform, status: p.status || "disconnected" };
          }
        }
        setConnectedMap(map);
      }
    } catch (err) {
      console.error("Failed to fetch social accounts:", err);
    } finally {
      setLoadingProviders(false);
    }
  }, [token, PLATFORMS]);

  useEffect(() => {
    fetchSocialAccounts();
  }, [fetchSocialAccounts]);

  const autoConnect = async (): Promise<string> => {
    if (!token) return "❌ Please login first";
    setAutoConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/social/auto-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Auto-connect failed");
      }
      const data = await res.json();
      await fetchSocialAccounts();
      return data.message || "✅ تم ربط جميع المنصات بنجاح!";
    } catch (err: any) {
      return `❌ ${err.message}`;
    } finally {
      setAutoConnecting(false);
    }
  };

  const disconnect = async (selected: string): Promise<string> => {
    if (!token) return "❌ Not logged in";
    const record = connectedMap[selected];
    if (!record) return "❌ Record not found";

    try {
      const res = await fetch(`${API_BASE}/social/${record.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to disconnect");
      }

      setConnectedMap(prev => {
        const next = { ...prev };
        delete next[selected];
        return next;
      });
      return "✅ Disconnected successfully";
    } catch (err: any) {
      return `❌ ${err.message}`;
    }
  };

  const saveConfig = async (selected: string, platformValues: any): Promise<string> => {
    if (!token) return "❌ Not logged in";
    try {
      const payload = {
        platform: selected,
        apiKey: platformValues["API Key"] || platformValues["App ID"] || platformValues["Client ID"] || platformValues["Client Key"] || "",
        apiSecret: platformValues["API Secret"] || platformValues["App Secret"] || platformValues["Client Secret"] || "",
        accessToken: platformValues["Access Token"] || platformValues["Bot Token"] || platformValues["OAuth Token"] || platformValues["Integration Token"] || platformValues["Page Access Token"] || "",
        status: "connected",
        connectionSource: "manual"
      };
      const res = await fetch(`${API_BASE}/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save credentials");
      }
      await fetchSocialAccounts();
      return "✅ تم الحفظ بنجاح";
    } catch (err: any) {
      return `❌ ${err.message}`;
    }
  };

  const testConn = async (selected: string): Promise<string> => {
    if (!token) return "❌ Not logged in";
    try {
      const res = await fetch(`${API_BASE}/social`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const accounts = data.accounts || [];
      const dbRecord = accounts.find((a: any) => a.platform.toLowerCase() === selected);
      
      if (dbRecord && (dbRecord.status === "connected" || dbRecord.status === "active")) {
        return "✅ Connection successful — Authenticated with DB";
      } else {
        return "❌ Not connected — Please OAuth or add credentials first";
      }
    } catch (err) {
      return "❌ Error connecting to database";
    }
  };

  const publishAll = async (publishForm: any): Promise<{ result: string, message: string }> => {
    if (!publishForm.title) {
      return { result: "", message: "❌ يرجى إدخال عنوان المنشور على الأقل" };
    }
    try {
      const tagsArray = publishForm.tags.split(" ").filter(Boolean);
      const res = await fetch(`${API_BASE}/social/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: publishForm.title,
          description: publishForm.description,
          videoUrl: publishForm.videoUrl || undefined,
          tags: tagsArray,
          platforms: ["all"],
          aiOptimize: publishForm.aiOptimize,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "فشل النشر المتزامن");
      }

      const data = await res.json();
      return { result: `✅ ${data.summary}`, message: "🚀 تم إرسال المحتوى لكل المنصات المتصلة بنجاح!" };
    } catch (err: any) {
      return { result: `❌ فشل النشر: ${err.message}`, message: `❌ ${err.message}` };
    }
  };

  return {
    connectedMap,
    loadingProviders,
    autoConnecting,
    autoConnect,
    disconnect,
    saveConfig,
    testConn,
    publishAll
  };
}
