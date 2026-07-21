interface PromptTestPanelProps {
  testInput: string;
  setTestInput: (val: string) => void;
  runTest: () => void;
  isTesting: boolean;
  testOutput: string;
  outputRef: React.RefObject<HTMLPreElement | null>;
}

export function PromptTestPanel({ testInput, setTestInput, runTest, isTesting, testOutput, outputRef }: PromptTestPanelProps) {
  return (
    <div className="glass-card p-5 rounded-xl border border-cyan-500/20">
      <h3 className="text-sm font-bold text-cyan-300 mb-4">🧪 Test AI</h3>
      <textarea value={testInput} onChange={e => setTestInput(e.target.value)} rows={3}
        placeholder="Ask something..." className="w-full px-4 py-3 rounded-xl bg-black/40 border border-cyan-500/20 text-white text-sm mb-3" />
      <button onClick={runTest} disabled={isTesting || !testInput.trim()}
        className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 disabled:opacity-40 mb-4 flex items-center gap-2">
        {isTesting ? <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "▶ Run Test"}
      </button>
      {testOutput && (
        <pre ref={outputRef} className="text-xs text-purple-200 font-mono whitespace-pre-wrap p-4 rounded-xl bg-[#0a0614] border border-purple-500/20 max-h-96 overflow-y-auto">
          {testOutput}
        </pre>
      )}
    </div>
  );
}
