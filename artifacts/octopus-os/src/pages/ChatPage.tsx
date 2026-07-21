import { useState, useEffect, useRef } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
  id: string;
  sender: "user" | "agent";
  agentName?: string;
  text: string;
  timestamp: string;
  thoughtLog?: string[];
}

interface AgentOption {
  id: string;
  name: string;
  description: string;
}

export function ChatPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeThoughts, setActiveThoughts] = useState<string[]>([]);

  // Whether an AI provider config exists in the DB
  const [hasProviderConfig, setHasProviderConfig] = useState<boolean | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if any AI provider config exists
  useEffect(() => {
    // We now have direct Gemini env key in Railway, so we assume AI is always available for Chat
    setHasProviderConfig(true);
  }, [token]);

  // Fetch agents on load
  useEffect(() => {
    const fetchAgents = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/agents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const active = data.filter((a: any) => a.status === "active");
          setAgents(
            active.map((a: any) => ({
              id: a.id,
              name: a.name,
              description: a.description || "Virtual Worker",
            }))
          );
          if (active.length > 0) {
            setSelectedAgentId(active[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAgents();
  }, [token]);

  // Scroll to bottom of message logs
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeThoughts]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !token) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(prev => [...prev, userMessage]);
    const promptToSend = inputValue;
    setInputValue("");
    setLoading(true);
    setActiveThoughts(["Initializing agent invoke sequence...", "Loading prompt context..."]);

    const agent = agents.find(a => a.id === selectedAgentId);
    const agentName = agent ? agent.name : "Agent";

    try {
      const historyToSend = messages.map(m => ({ role: m.sender, text: m.text }));
      
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: promptToSend,
          agentName: agentName,
          history: historyToSend 
        }),
      });

      if (!res.ok) {
        let errStr = "Failed to invoke agent";
        try {
          const errData = await res.json();
          if (errData.error) errStr = errData.error;
        } catch(e) {}
        throw new Error(errStr);
      }

      const data = await res.json();

      const finalResult = data.reply || "Task completed successfully.";
      const thoughtLog = ["Gemini AI response complete."];


      const agentMessage: Message = {
        id: crypto.randomUUID(),
        sender: "agent",
        agentName,
        text: finalResult,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thoughtLog,
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: "agent",
        agentName,
        text: `Error: ${err.message || "Failed to execute agent invocation. Check database and api-server connections."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thoughtLog: ["Failed to finalize agent thread."],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setActiveThoughts([]);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen flex flex-col justify-between" style={{ background: "#06020f" }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            💬 {t("agentTerminal")}
            <span className="text-xs px-2 py-0.5 rounded-full font-normal bg-purple-950/40 border border-purple-500/20 text-purple-400">
              {t("agentTerminalActive")}
            </span>
          </h1>
          <p className="text-purple-400/60 text-xs mt-1">{t("agentTerminalDesc")}</p>
        </div>

        {/* Selected Agent Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-purple-400">{t("selectWorker")}:</label>
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
            className="bg-purple-950/50 text-white border border-purple-500/20 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-purple-500/40 font-heading"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id} className="bg-[#0c051a]">
                {a.name} ({a.description})
              </option>
            ))}
            {agents.length === 0 && (
              <option value="" className="bg-[#0c051a]">
                No active agents
              </option>
            )}
          </select>
        </div>
      </div>

      {/* AI Provider notice */}
      {hasProviderConfig === false && (
        <div className="px-4 py-3 rounded-xl text-xs bg-amber-900/20 border border-amber-500/30 text-amber-400 flex items-center gap-2">
          ⚠️ Configure an AI provider in <strong>AI Providers</strong> page first before sending messages.
        </div>
      )}

      {/* Main chat layout */}
      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden h-[450px] border border-purple-950">

        {/* Messages viewport */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <span className="text-4xl text-purple-500/40 animate-bounce">💬</span>
              <p className="text-xs text-purple-400/40 font-mono">
                Initiate a conversation with one of your active workers.<br />
                Instruct them to generate content, analyze trend data, or fetch ledger summaries.
              </p>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"} animate-fadeIn`}>
              {/* Sender Tag */}
              <span className="text-[10px] text-purple-400/50 mb-1 font-mono">
                {m.sender === "user" ? t("you") : m.agentName} · {m.timestamp}
              </span>

              {/* Message bubble */}
              <div className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed font-heading ${
                m.sender === "user"
                  ? "bg-purple-600 text-white rounded-br-none font-medium glow-purple-sm"
                  : "bg-purple-950/30 text-purple-100 border border-purple-900 rounded-bl-none font-medium"
              }`}>
                {m.text}

                {/* Show Thought Log (collapsible) if agent ran sub-tasks */}
                {m.thoughtLog && m.thoughtLog.length > 0 && (
                  <details className="mt-3 border-t border-purple-900/60 pt-2 cursor-pointer outline-none">
                    <summary className="text-[10px] text-purple-400/60 font-mono hover:text-purple-300 font-bold">
                      {t("viewExecutionThoughts")} ({m.thoughtLog.length})
                    </summary>
                    <div className="mt-2 space-y-1 text-[9px] font-mono text-purple-400/80 bg-black/40 rounded-lg p-2 leading-relaxed">
                      {m.thoughtLog.map((step, sIdx) => (
                        <div key={sIdx} className="border-l border-purple-500/30 pl-2">↳ {step}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {/* Active Loading / Thought sequence */}
          {loading && (
            <div className="flex flex-col items-start animate-pulse">
              <span className="text-[10px] text-purple-400/50 mb-1 font-mono">
                {agents.find(a => a.id === selectedAgentId)?.name || "Agent"} is thinking...
              </span>
              <div className="max-w-[75%] rounded-2xl p-4 bg-purple-950/20 text-purple-400/70 border border-purple-900/40 rounded-bl-none font-mono text-[10px] space-y-1.5">
                {activeThoughts.map((thought, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-purple-500">⚡</span> {thought}
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-purple-300 font-bold mt-1 animate-pulse">
                  <span>●</span><span>●</span><span>●</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Panel */}
        <form onSubmit={handleSendMessage} className="p-4 bg-purple-950/10 border-t border-purple-950/60 flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={loading}
            placeholder={loading ? "Waiting for agent process..." : t("typeMessagePlaceholder")}
            className="flex-1 bg-black/60 border border-purple-950 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-purple-500/30 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all glow-purple-sm font-sans"
          >
            {t("send")}
          </button>
        </form>

      </div>
    </div>
  );
}
