import React from "react";

interface PublishModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  form: { title: string; description: string; videoUrl: string; tags: string; aiOptimize: boolean };
  setForm: (form: any) => void;
  onPublish: () => void;
  publishing: boolean;
  result: string | null;
}

export function PublishModal({
  show, setShow,
  form, setForm,
  onPublish,
  publishing, result
}: PublishModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#130d2a] border border-purple-600/60 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(126,34,206,0.3)]">
        <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <span>🤖</span> النشر الذكي المتزامن (AI Social Engine)
        </h3>
        <p className="text-xs text-purple-300 mb-4">
          سيقوم المحرك الذكي بصياغة وتحسين الوصف والهاشتاغات تلقائياً بما يناسب كل منصة متصلة (Reels / Shorts / Posts).
        </p>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[10px] font-bold text-purple-400 mb-1">عنوان الفيديو / المنشور *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: سر الربح من الذكاء الاصطناعي في 2026"
              className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-purple-400 mb-1">الوصف التفصيلي</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="اكتب هنا تفاصيل الفيديو، وسيتكفل الوكيل الذكي بتعديله لكل منصة..."
              className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-purple-400 mb-1">رابط ملف الفيديو (Video URL - اختيار للمقاطع)</label>
            <input
              type="text"
              value={form.videoUrl}
              onChange={e => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://.../video.mp4"
              className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-purple-400 mb-1">الهاشتاغات المستهدفة</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="#AI #Viral #OCTOPUS"
              className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.aiOptimize}
              onChange={e => setForm({ ...form, aiOptimize: e.target.checked })}
              className="rounded text-purple-600 focus:ring-0 w-4 h-4"
            />
            <span className="text-xs font-bold text-emerald-400">✨ تفعيل تحسين المحتوى الآلي لكل منصة (AI Tailoring)</span>
          </label>
        </div>

        {result && (
          <div className="p-3 bg-[#0d0920] border border-purple-800/50 rounded-xl text-xs font-mono text-purple-200 mb-4 break-words">
            {result}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShow(false)}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            إغلاق
          </button>
          <button
            onClick={() => onPublish()}
            disabled={publishing}
            className="flex-[2] px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {publishing ? "⏳ جارٍ النشر المتزامن..." : "🚀 انشر على كل المنصات الآن"}
          </button>
        </div>
      </div>
    </div>
  );
}
