import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";
import { YouTubeConnectionCard } from "@/components/social/YouTubeConnectionCard";
import { PlatformList } from "@/components/social/PlatformList";
import { ConnectionSettings } from "@/components/social/ConnectionSettings";
import { PublishModal } from "@/components/social/PublishModal";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";

const PLATFORMS = [
  { id: "tiktok",    icon: "🎵", name: "TikTok",      color: "#ff0050" },
  { id: "instagram", icon: "📸", name: "Instagram",   color: "#e1306c" },
  { id: "facebook",  icon: "👍", name: "Facebook",    color: "#1877f2" },
  { id: "threads",   icon: "🧵", name: "Threads",     color: "#000000" },
  { id: "youtube",   icon: "▶️", name: "YouTube",     color: "#ff0000" },
  { id: "x",         icon: "✖️", name: "X (Twitter)", color: "#000000" },
  { id: "linkedin",  icon: "💼", name: "LinkedIn",    color: "#0077b5" },
  { id: "pinterest", icon: "📌", name: "Pinterest",   color: "#e60023" },
  { id: "snapchat",  icon: "👻", name: "Snapchat",    color: "#fffc00" },
  { id: "reddit",    icon: "🔴", name: "Reddit",      color: "#ff4500" },
  { id: "telegram",  icon: "✈️", name: "Telegram",    color: "#0088cc" },
  { id: "discord",   icon: "🎮", name: "Discord",     color: "#5865f2" },
  { id: "medium",    icon: "✍️", name: "Medium",      color: "#000000" },
  { id: "wordpress", icon: "🌐", name: "WordPress",   color: "#21759b" },
  { id: "tumblr",    icon: "📝", name: "Tumblr",      color: "#35465c" },
];

const FIELDS: Record<string, string[]> = {
  tiktok:    ["Client Key", "Client Secret", "Access Token", "Redirect URI"],
  instagram: ["App ID", "App Secret", "Access Token", "Redirect URI"],
  facebook:  ["App ID", "App Secret", "Page Access Token", "Redirect URI"],
  threads:   ["App ID", "App Secret", "Access Token", "Redirect URI"],
  youtube:   ["Client ID", "Client Secret", "API Key", "Redirect URI"],
  x:         ["API Key", "API Secret", "Access Token", "Access Token Secret"],
  linkedin:  ["Client ID", "Client Secret", "Access Token", "Redirect URI"],
  pinterest: ["App ID", "App Secret", "Access Token", "Redirect URI"],
  snapchat:  ["Client ID", "Client Secret", "Access Token", "Redirect URI"],
  reddit:    ["Client ID", "Client Secret", "Username", "Password"],
  telegram:  ["Bot Token", "Chat ID", "Webhook URL", ""],
  discord:   ["Bot Token", "Guild ID", "Channel ID", "Webhook URL"],
  medium:    ["Integration Token", "Publication ID", "", ""],
  wordpress: ["Site URL", "Username", "Application Password", ""],
  tumblr:    ["Consumer Key", "Consumer Secret", "OAuth Token", "OAuth Token Secret"],
};

export function SocialPage() {
  const { token, user } = useAuth();
  const [selected, setSelected] = useState("tiktok");
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const {
    connectedMap,
    loadingProviders,
    autoConnecting,
    autoConnect: doAutoConnect,
    disconnect: doDisconnect,
    saveConfig: doSaveConfig,
    testConn: doTestConn,
    publishAll: doPublishAll
  } = useSocialAccounts(token, PLATFORMS);

  // AI Multi-channel publishing modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: "", description: "", videoUrl: "", tags: "#OCTOPUS_OS #AI #Viral", aiOptimize: true });
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  const defaultDomain = "finalsnapshot.vercel.app";
  const apiUrl = API_BASE.replace(/\/api$/, "");
  const domain = apiUrl.replace("https://", "").replace("http://", "") || defaultDomain;

  const platforms = PLATFORMS.map(p => {
    const record = connectedMap[p.id];
    let status = record?.status || "NOT_CONFIGURED";
    if (status === "active" || status === "configured" || status === "connected") {
      status = "CONNECTED";
    }
    return {
      ...p,
      status,
      followers: record?.followers || "0",
      dbId: record?.id,
      connectionSource: record?.connectionSource,
    };
  });

  const platform = platforms.find(p => p.id === selected)!;
  const fields = FIELDS[selected] || [];

  const setVal = (field: string, val: string) => {
    setValues(v => ({ ...v, [selected]: { ...v[selected], [field]: val } }));
  };

  const connect = async () => {
    if (!token || !user) {
      setSaveMsg("❌ Please login first");
      return;
    }
    setSaving(true);
    setSaveMsg("⏳ Redirecting to authorization provider...");
    const connectUrl = `${API_BASE}/oauth/${selected}/connect?userId=${user.id}`;
    window.location.href = connectUrl;
  };

  const handleAutoConnect = async () => {
    setSaveMsg("");
    const msg = await doAutoConnect();
    setSaveMsg(msg);
  };

  const handleDisconnect = async () => {
    setSaving(true);
    setSaveMsg("");
    const msg = await doDisconnect(selected);
    setSaveMsg(msg);
    setSaving(false);
  };

  const handleSaveConfig = async () => {
    const platformValues = values[selected];
    if (platformValues && Object.values(platformValues).some(v => v)) {
      setSaving(true);
      setSaveMsg("");
      const msg = await doSaveConfig(selected, platformValues);
      setSaveMsg(msg);
      setSaving(false);
    } else {
      await connect();
    }
  };

  const handleTestConn = async () => {
    setTesting(true);
    setTestMsg("");
    const msg = await doTestConn(selected);
    setTestMsg(msg);
    setTesting(false);
  };

  const handlePublishAllClick = async () => {
    setPublishing(true);
    setPublishResult(null);
    const { result, message } = await doPublishAll(publishForm);
    setPublishResult(result);
    setSaveMsg(message);
    setPublishing(false);
  };

  return (
    <div className="flex h-full min-h-screen relative" style={{ background: "#0a0614" }}>
      <PublishModal
        show={showPublishModal}
        setShow={setShowPublishModal}
        form={publishForm}
        setForm={setPublishForm}
        onPublish={handlePublishAllClick}
        publishing={publishing}
        result={publishResult}
      />

      <PlatformList
        platforms={platforms}
        selected={selected}
        setSelected={setSelected}
        loadingProviders={loadingProviders}
        setShowPublishModal={setShowPublishModal}
        setTestMsg={setTestMsg}
        setSaveMsg={setSaveMsg}
      />

      {selected === "youtube" ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <YouTubeConnectionCard />
        </div>
      ) : (
        <ConnectionSettings
          platform={platform}
          selected={selected}
          testConn={handleTestConn}
          testing={testing}
          disconnect={handleDisconnect}
          connect={connect}
          saving={saving}
          autoConnect={handleAutoConnect}
          autoConnecting={autoConnecting}
          testMsg={testMsg}
          saveMsg={saveMsg}
          fields={fields}
          values={values}
          setVal={setVal}
          saveConfig={handleSaveConfig}
          domain={domain}
        />
      )}
    </div>
  );
}
