import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";

interface YouTubeStatus {
  status: string;
  channelTitle?: string;
  redactedChannelId?: string;
  scopes?: string[];
  tokenExpiry?: string;
  lastVerification?: string;
  uploadPermission?: string;
}

export function YouTubeConnectionCard() {
  const { token } = useAuth();
  const [statusData, setStatusData] = useState<YouTubeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/integrations/youtube/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatusData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStatus();
    }
  }, [token]);

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/youtube/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate authorization URL");
      }
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/youtube/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      fetchStatus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading YouTube Status...</div>;

  const currentStatus = statusData?.status || "AUTHORIZATION_REQUIRED";

  return (
    <Card className="bg-[#0d0920] border-purple-500/30 text-white shadow-xl shadow-purple-900/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-red-500 text-2xl">▶️</span>
            YouTube
          </CardTitle>
          <Badge variant={
            currentStatus === "LIVE_VERIFIED" ? "default" :
            currentStatus === "AUTHORIZATION_REQUIRED" ? "destructive" :
            "secondary"
          }>
            {currentStatus}
          </Badge>
        </div>
        <CardDescription className="text-purple-300/70">
          Connect your YouTube channel to enable AI-powered video publishing.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded">{error}</div>}
        
        {currentStatus === "LIVE_VERIFIED" && statusData ? (
          <div className="space-y-2 text-sm bg-[#130d2a] p-4 rounded-lg border border-purple-900/50">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-purple-400/70">Channel Title:</span>
              <span className="font-semibold">{statusData.channelTitle}</span>
              
              <span className="text-purple-400/70">Channel ID:</span>
              <span className="font-mono text-xs">{statusData.redactedChannelId}</span>
              
              <span className="text-purple-400/70">Scopes:</span>
              <span className="text-xs">{statusData.scopes?.join(", ")}</span>
              
              <span className="text-purple-400/70">Upload Permission:</span>
              <span className="text-emerald-400">{statusData.uploadPermission}</span>
              
              <span className="text-purple-400/70">Last Verified:</span>
              <span className="text-xs">{new Date(statusData.lastVerification || "").toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-purple-300">
            Please authorize Octopus OS to access your YouTube channel.
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {currentStatus === "LIVE_VERIFIED" ? (
          <>
            <Button variant="outline" onClick={fetchStatus} className="bg-transparent border-purple-500/50 text-purple-300 hover:bg-purple-900/30">
              Verify
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
            Connect YouTube
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
