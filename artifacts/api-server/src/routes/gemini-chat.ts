import { Router, type IRouter } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const GEMINI_API_KEY = process.env["GEMINI_API_KEY"] || "";
const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * POST /api/chat
 * Direct Gemini AI chat endpoint — works with GEMINI_API_KEY env variable.
 */
router.post("/chat", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { message, agentName, history } = req.body as {
      message: string;
      agentName?: string;
      history?: Array<{ role: string; text: string }>;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    if (!GEMINI_API_KEY) {
      res.status(503).json({ error: "GEMINI_API_KEY not configured on server." });
      return;
    }

    // 1. Simple Intent Recognition: Trigger internal system agents BEFORE Gemini call
    let thoughtLog: string[] | undefined = undefined;
    try {
      const msgLower = message.toLowerCase();
      // Import dynamically to avoid circular dependencies
      const { executeRealAgentAction } = await import("../lib/agent-action-executor.js");
      
      if (msgLower.includes("فيديو") || msgLower.includes("video") || msgLower.includes("صنع") || msgLower.includes("render")) {
        const actionResult = await executeRealAgentAction("Creator Agent", "chat", "chat-run", message, req.user?.userId) as any;
        thoughtLog = [
          "🎬 " + (actionResult?.taskExecuted || "Started Video Generation"),
          `Product: ${actionResult?.product || "Unknown"}`,
          `Job Status: ${actionResult?.status || "Queued"}`
        ];
      } else if (msgLower.includes("منتج") || msgLower.includes("product") || msgLower.includes("تريند") || msgLower.includes("trend")) {
        const actionResult = await executeRealAgentAction("TrendHunter", "chat", "chat-run", message, req.user?.userId) as any;
        thoughtLog = [
          "🔥 " + (actionResult?.taskExecuted || "Scanned Amazon & Digistore24"),
          `Discovered: ${actionResult?.discoveredCount || 0} products`,
          `Unlaunched: ${actionResult?.unlaunchedCount || 0} products`
        ];
      }
    } catch (err) {
      console.error("Agent execution error:", err);
      thoughtLog = ["⚠️ Failed to execute system agent command."];
    }

    // 2. Call Gemini
    const systemContext = agentName
      ? `You are ${agentName}, an AI agent in OCTOPUS NEXUS OS — an autonomous AI marketing operating system. You help with affiliate marketing, social media growth, content creation, campaign strategy, and profit optimization. Be concise, strategic, and action-oriented. Respond in the same language as the user.`
      : `You are OCTOPUS Brain — the central AI intelligence of OCTOPUS NEXUS OS. You help with affiliate marketing, content creation, social media strategy, and automated profit systems. Be direct, smart, and practical. Respond in the same language as the user.`;

    const contents: any[] = [];
    if (history && history.length > 0) {
      for (const h of history.slice(-10)) {
        contents.push({
          role: h.role === "agent" ? "model" : "user",
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const payload = {
      system_instruction: { parts: [{ text: systemContext }] },
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024, topP: 0.95 }
    };

    let reply = "";
    
    try {
      const geminiRes = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!geminiRes.ok) {
        // If we hit a rate limit (429) but we ALREADY successfully executed an intent, just gracefully fallback.
        if (geminiRes.status === 429 && thoughtLog && thoughtLog.length > 0) {
          reply = "لقد وصلت للحد الأقصى المجاني من محادثات Gemini، ولكنني قمت بتنفيذ طلبك بنجاح في الخلفية (انظر لسجل الأفكار).";
        } else {
          const errText = await geminiRes.text();
          res.status(502).json({ error: `Gemini API error (${geminiRes.status}): ${errText}` });
          return;
        }
      } else {
        const geminiData = await geminiRes.json() as any;
        reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتلق ردًا من Gemini.";
      }
    } catch (networkErr) {
      if (thoughtLog && thoughtLog.length > 0) {
        reply = "حدث خطأ في الاتصال بنموذج Gemini، ولكن تم تنفيذ أمرك بنجاح في النظام.";
      } else {
        throw networkErr;
      }
    }

    res.json({
      reply,
      thoughtLog,
      model: GEMINI_MODEL,
      agentName: agentName || "OCTOPUS Brain",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Chat error: ${msg}` });
  }
});

/**
 * POST /api/chat/generate-content
 * Generates marketing content (video scripts, captions, hooks) using Gemini AI.
 */
router.post("/chat/generate-content", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { type, product, platform, affiliateLink, language } = req.body as {
      type: "script" | "hook" | "caption" | "strategy";
      product: string;
      platform: string;
      affiliateLink?: string;
      language?: string;
    };

    if (!GEMINI_API_KEY) {
      res.status(503).json({ error: "GEMINI_API_KEY not configured." });
      return;
    }

    const lang = language || "Arabic";

    const prompts: Record<string, string> = {
      script: `Write a 60-second viral video script for "${product}" targeting ${platform} audience. Include: hook (first 3 seconds), problem, solution, CTA with this link: ${affiliateLink || ""}. Language: ${lang}. Make it emotional and urgent.`,
      hook: `Write 5 different viral video hooks for "${product}" on ${platform}. Each hook should grab attention in the first 3 seconds. Language: ${lang}. Format as numbered list.`,
      caption: `Write a high-converting social media caption for "${product}" on ${platform}. Include emojis, hashtags, and a clear CTA. Affiliate link: ${affiliateLink || ""}. Language: ${lang}.`,
      strategy: `Create a complete 7-day viral marketing strategy for "${product}" on ${platform}. Include: content types, posting schedule, engagement tactics, expected results. Language: ${lang}.`,
    };

    const prompt = prompts[type] || prompts.script;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048, topP: 0.95 }
    };

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const geminiData = await geminiRes.json() as any;
    const content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({ content, type, product, platform, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export { router as geminiChatRouter };
