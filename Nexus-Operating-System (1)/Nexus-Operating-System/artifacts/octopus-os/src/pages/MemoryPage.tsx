export function MemoryPage() {
  const items = [
    { cat: "Best Posting Times", icon: "🕐", entries: [
      { key: "TikTok", val: "7 PM – 9 PM (EST) — +41% engagement" },
      { key: "Instagram", val: "11 AM – 1 PM (EST) — +28% reach" },
      { key: "YouTube", val: "5 PM – 7 PM (EST) — +33% views" },
    ]},
    { cat: "Best Products", icon: "🏆", entries: [
      { key: "Weight Loss Supplement X", val: "$4.28 EPC — 12.4% conversion" },
      { key: "AI Tool Y", val: "$3.91 EPC — 9.8% conversion" },
      { key: "Fitness Course Z", val: "$6.12 EPC — 8.1% conversion" },
    ]},
    { cat: "Best Platforms", icon: "📱", entries: [
      { key: "TikTok", val: "Highest reach — Best for viral hooks" },
      { key: "Pinterest", val: "Best CTR (5.4%) — Best for products" },
      { key: "YouTube", val: "Highest retention — Best for reviews" },
    ]},
    { cat: "Best Hooks", icon: "🪝", entries: [
      { key: "Question Hook", val: "+67% watch time vs. statement hooks" },
      { key: "Shocking Stat", val: "+54% shares — Works on TikTok/X" },
      { key: "Story Hook", val: "+41% completion — Best on YouTube" },
    ]},
    { cat: "Best Video Duration", icon: "⏱️", entries: [
      { key: "TikTok", val: "30–45 seconds — Peak engagement" },
      { key: "Instagram Reels", val: "25–30 seconds — Best CTR" },
      { key: "YouTube Shorts", val: "45–60 seconds — Best retention" },
    ]},
    { cat: "Learning Log", icon: "📚", entries: [
      { key: "Today", val: "Morning posts perform 28% worse — avoid before 9 AM" },
      { key: "Yesterday", val: "Campaign #4 — Pinterest outperformed TikTok by 3x" },
      { key: "This Week", val: "AI tool niche CTR increased 41% vs last week" },
    ]},
  ];

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🧠 Memory Engine</h1>
        <p className="text-purple-400/60 text-xs mt-1">The OS learns daily — every insight is remembered and applied</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map(section => (
          <div key={section.cat} className="card-os p-4">
            <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
              <span>{section.icon}</span> {section.cat}
            </h3>
            <div className="space-y-2.5">
              {section.entries.map(e => (
                <div key={e.key} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                  <div>
                    <div className="text-xs font-semibold text-white">{e.key}</div>
                    <div className="text-xs text-purple-400/70">{e.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
