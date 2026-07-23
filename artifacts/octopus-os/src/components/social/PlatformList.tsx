import React from "react";

interface Platform {
  id: string;
  icon: string;
  name: string;
  color: string;
  status: string;
  followers?: string;
  dbId?: string;
  connectionSource?: string;
}

interface PlatformListProps {
  platforms: Platform[];
  selected: string;
  setSelected: (id: string) => void;
  loadingProviders: boolean;
  setShowPublishModal: (show: boolean) => void;
  setTestMsg: (msg: string) => void;
  setSaveMsg: (msg: string) => void;
}

export function PlatformList({
  platforms,
  selected,
  setSelected,
  loadingProviders,
  setShowPublishModal,
  setTestMsg,
  setSaveMsg,
}: PlatformListProps) {
  return (
    <div className="w-52 shrink-0 py-4 px-2 overflow-y-auto" style={{ background: "#0d0920", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
      <div className="flex items-center justify-between px-2 py-2 mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-purple-500/50">
          {loadingProviders ? "Loading..." : `${platforms.length} Platforms`}
        </span>
        <button
          onClick={() => setShowPublishModal(true)}
          className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[9px] font-black rounded shadow transition-all"
        >
          🚀 نشر ذكي
        </button>
      </div>
      {platforms.map(p => {
        const isConnected = ["CONNECTED", "LIVE_VERIFIED"].includes(p.status);
        return (
          <button key={p.id} onClick={() => { setSelected(p.id); setTestMsg(""); setSaveMsg(""); }}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium mb-0.5 transition-all ${selected === p.id ? "gradient-purple text-white" : "text-purple-300/70 hover:bg-purple-900/30"}`}>
            <span className="text-sm">{p.icon}</span>
            <span className="flex-1 text-left">{p.name}</span>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? "bg-emerald-400" : "bg-gray-600"}`}></div>
          </button>
        );
      })}
    </div>
  );
}
