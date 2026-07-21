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

    const systemContext = agentName
      ? `You are ${agentName}, an AI agent in OCTOPUS NEXUS OS — an autonomous AI marketing operating system. You help with affiliate marketing, social media growth, content creation, campaign strategy, and profit optimization. Be concise, strategic, and action-oriented. Respond in the same language as the user.`
      : `You are OCTOPUS Brain — the central AI intelligence of OCTOPUS NEXUS OS. You help with affiliate marketing, content creation, social media strategy, and automated profit systems. Be direct, smart, and practical. Respond in the same language as the user.`;

    // Build conversation history
    const contents: any[] = [];

    // Add history if present
    if (history && history.length > 0) {
      for (const h of history.slice(-10)) { // Last 10 messages for context
        contents.push({
          role: h.role === "agent" ? "model" : "user",
          parts: [{ text: h.text }]
        });
      }
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const payload = {
      system_instruction: {
        parts: [{ text: systemContext }]
      },
      contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
        topP: 0.95,
      }
    };

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      res.status(502).json({ error: `Gemini API error (${geminiRes.status}): ${errText}` });
      return;
    }

    const geminiData = await geminiRes.json() as any;
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتلق ردًا من Gemini.";

    res.json({
      reply,
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
