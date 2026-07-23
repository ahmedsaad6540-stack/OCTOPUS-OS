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

    // 2. Call Gemini
    const baseContext = agentName
      ? `You are ${agentName}, an AI agent in OCTOPUS NEXUS OS — an autonomous AI marketing operating system. You help with affiliate marketing, social media growth, content creation, campaign strategy, and profit optimization. Be concise, strategic, and action-oriented. Respond in the same language as the user.`
      : `You are OCTOPUS Brain — the central AI intelligence of OCTOPUS NEXUS OS. You help with affiliate marketing, content creation, social media strategy, and automated profit systems. Be direct, smart, and practical. Respond in the same language as the user.`;

    const systemContext = `${baseContext}
    
CRITICAL SYSTEM PRIVILEGES: You have full control over the application's database. If the user explicitly asks you to perform an action (e.g., create a campaign, generate videos, hunt for trends, or grow social accounts), you MUST execute it by appending a JSON block at the very end of your response, wrapped in triple backticks \`\`\`json.
Valid Agents: "Campaign Manager", "TrendHunter", "Creator Agent", "Publisher Agent", "Brain/CEO".
Example:
\`\`\`json
{
  "execute": true,
  "agent": "Campaign Manager",
  "action": "CREATE_CAMPAIGN",
  "params": {
    "name": "Coffee Gadgets Campaign",
    "budget": 100
  }
}
\`\`\`
Only output this JSON if a real system action is requested. If the user is just asking a general question, do not output the JSON.
`;

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
        let reply = "";
    let thoughtLog: string[] | undefined = undefined;
    let usedModel = GEMINI_MODEL;
    
    try {
      const geminiRes = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (geminiRes.status === 429 || !geminiRes.ok) {
        console.warn(`[AI Router] Gemini failed with status ${geminiRes.status}. Attempting OpenAI fallback...`);
        const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];
        
        if (OPENAI_API_KEY) {
          const openAiMessages = [{ role: "system", content: systemContext }];
          if (history && history.length > 0) {
            for (const h of history.slice(-10)) {
              openAiMessages.push({
                role: h.role === "agent" ? "assistant" : "user",
                content: h.text
              });
            }
          }
          openAiMessages.push({ role: "user", content: message });

          const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: openAiMessages,
              temperature: 0.8,
              max_tokens: 1024
            })
          });

          if (openAiRes.ok) {
            const openAiData = await openAiRes.json() as any;
            reply = openAiData.choices?.[0]?.message?.content || "عذراً، لم أتلق ردًا من OpenAI.";
            usedModel = "gpt-4o-mini (Fallback)";
            thoughtLog = ["🔄 Switched to OpenAI (GPT-4o) automatically due to Gemini limits."];
          } else {
            throw new Error(`OpenAI Fallback failed with status ${openAiRes.status}`);
          }
        } else {
          throw new Error(`Gemini failed (${geminiRes.status}) and no OPENAI_API_KEY for fallback.`);
        }
      } else {
        const geminiData = await geminiRes.json() as any;
        reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتلق ردًا من Gemini.";
      }
    } catch (networkErr) {
      console.error("AI API Error:", networkErr);
      res.status(502).json({ error: String(networkErr) });
      return;
    }

    // --- JSON INTENT ROUTER PARSING ---
    try {
      const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.execute && parsed.agent) {
          // Remove the JSON block from the text sent to the user
          reply = reply.replace(/```json\n[\s\S]*?\n```/, "").trim();
          
          // Execute the dynamic intent
          const { executeRealAgentAction } = await import("../lib/agent-action-executor.js");
          // We pass the parsed JSON directly into the message or baseOutput parameter
          // stringifying it so executor can read it easily
          const actionResult = await executeRealAgentAction(parsed.agent, "chat", "chat-run", JSON.stringify(parsed), req.user?.userId) as any;
          
          const logs = thoughtLog || [];
          logs.push(`⚡ Executed OS Command: ${parsed.action}`);
          if (parsed.params) logs.push(`Params: ${JSON.stringify(parsed.params)}`);
          if (actionResult?.status) logs.push(`Status: ${actionResult.status}`);
          if (actionResult?.campaignName) logs.push(`Campaign: ${actionResult.campaignName}`);
          
          thoughtLog = logs;
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse or execute LLM JSON intent:", parseErr);
    }

    res.json({
      reply,
      thoughtLog,
      model: usedModel,
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

    let content = "";
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (geminiRes.status === 429 || !geminiRes.ok) {
      console.warn(`[Content Gen Router] Gemini failed with status ${geminiRes.status}. Attempting OpenAI fallback...`);
      const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];
      
      if (OPENAI_API_KEY) {
        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // Fast and cheap fallback
            messages: [{ role: "user", content: prompt }],
            temperature: 0.9,
            max_tokens: 2048
          })
        });

        if (openAiRes.ok) {
          const openAiData = await openAiRes.json() as any;
          content = openAiData.choices?.[0]?.message?.content || "";
          res.json({ content, type, product, platform, generatedAt: new Date().toISOString(), model: "gpt-4o-mini (Fallback)" });
          return;
        }
      }
      res.status(502).json({ error: "Gemini AI limit reached and OpenAI fallback failed or not configured." });
      return;
    }

    const geminiData = await geminiRes.json() as any;
    content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({ content, type, product, platform, generatedAt: new Date().toISOString(), model: GEMINI_MODEL });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export { router as geminiChatRouter };
