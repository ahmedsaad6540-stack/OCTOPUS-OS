import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { campaignsTable, agentRunsTable, agentsTable, videoJobsTable } from "@workspace/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { agentManager } from "../lib/agent-manager.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { executeRealAgentAction } from "../lib/agent-action-executor.js";
import { startAutonomousDaemon, stopAutonomousDaemon, getDaemonStatus } from "../lib/autonomous-daemon.js";

const router: IRouter = Router();

/**
 * POST /api/autonomous/run
 * The real autonomous engine. Executes key operational agents to discover products,
 * create campaigns, generate scripts, queue video jobs, and balance budgets.
 */
router.post("/autonomous/run", requireAuth, async (req: AuthRequest, res) => {
  const results: Array<{ agent: string; campaignName: string; status: string; output: unknown }> = [];

  try {
    const agents = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.status, "active"))
      .limit(10);

    if (agents.length === 0) {
      res.json({
        success: false,
        message: "لا توجد وكلاء نشطون. تحقق من صفحة AI Agents.",
        results: [],
      });
      return;
    }

    const campaigns = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.status, "active"))
      .limit(5);

    const campaign = campaigns[0] || {
      name: "AI Video & Content Masterclass (Viral Tech)",
      productName: "AI Video & Content Masterclass",
      platform: "tiktok",
      affiliateNetwork: "digistore24",
      productUrl: "https://aifluencersystem.de/start#aff=octopuslabai4418",
      budget: 100,
      revenue: 0,
      conversions: 0
    };

    for (const agent of agents) {
      const prompt = buildAgentPrompt(agent.name, {
        productName: campaign.productName ?? "AI Influencer System",
        platform: campaign.platform ?? "tiktok",
        affiliateNetwork: campaign.affiliateNetwork ?? "digistore24",
        affiliateLink: campaign.productUrl ?? "https://aifluencersystem.de/start#aff=octopuslabai4418",
        budget: Number(campaign.budget ?? 100),
        revenue: Number(campaign.revenue ?? 0),
        conversions: Number(campaign.conversions ?? 0),
      });

      try {
        let run = await agentManager.invoke(agent.id, { message: prompt }, req.user!.userId);
        const enrichedOutput = await executeRealAgentAction(agent.name, agent.id, run.id, run.output, req.user!.userId);
        run = { ...run, output: enrichedOutput as any };
        results.push({
          agent: agent.name,
          campaignName: campaign.name ?? "Autonomous Target",
          status: run.status,
          output: run.output,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          agent: agent.name,
          campaignName: campaign.name ?? "Autonomous Target",
          status: "error",
          output: msg,
        });
      }
    }

    res.json({
      success: true,
      message: `⚡ تم تنفيذ دورة التشغيل الذاتي الحقيقية (Autonomous Run) بنجاح عبر ${results.length} وكيل على حملة "${campaign.name}"!`,
      campaign: campaign.name,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg, results });
  }
});

/**
 * POST /api/autonomous/start
 * Activates the 24/7 background autonomous loop and launches immediate operational cycles.
 */
router.post("/autonomous/start", requireAuth, async (req: AuthRequest, res) => {
  try {
    startAutonomousDaemon(30_000);
    res.json({
      success: true,
      status: "running",
      message: "⚡ تم تفعيل محرك التشغيل الذاتي (Autonomous 24/7 Engine) بنجاح وبدء دورة العمليات الفورية والنشر والمراقبة!"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

/**
 * POST /api/autonomous/stop
 * Emergency Stop: halts the 24/7 daemon loop and pauses active campaigns and rendering video jobs.
 */
router.post("/autonomous/stop", requireAuth, async (req: AuthRequest, res) => {
  try {
    stopAutonomousDaemon();

    let stoppedJobsCount = 0;
    let pausedCampaignsCount = 0;

    try {
      const activeJobs = await db.select().from(videoJobsTable).where(inArray(videoJobsTable.status, ["rendering_video", "generating_script", "queued"]));
      stoppedJobsCount = activeJobs.length;
      if (stoppedJobsCount > 0) {
        await db.update(videoJobsTable).set({ status: "paused", updatedAt: new Date() }).where(inArray(videoJobsTable.status, ["rendering_video", "generating_script", "queued"]));
      }
    } catch (e) {}

    try {
      const activeCamps = await db.select().from(campaignsTable).where(inArray(campaignsTable.status, ["active", "running"]));
      pausedCampaignsCount = activeCamps.length;
      if (pausedCampaignsCount > 0) {
        await db.update(campaignsTable).set({ status: "paused", updatedAt: new Date() }).where(inArray(campaignsTable.status, ["active", "running"]));
      }
    } catch (e) {}

    res.json({
      success: true,
      status: "stopped",
      stoppedJobsCount,
      pausedCampaignsCount,
      message: `🛑 تم إيقاف التشغيل الذاتي وتجميد ${stoppedJobsCount} من عمليات إنتاج الفيديو و ${pausedCampaignsCount} من الحملات النشطة بنجاح!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

/**
 * GET /api/autonomous/status
 * Returns current real-time status of the autonomous daemon and execution queues.
 */
router.get("/autonomous/status", requireAuth, async (req: AuthRequest, res) => {
  try {
    const ds = getDaemonStatus();
    res.json({
      success: true,
      isRunning: ds.isRunning,
      isPolling: ds.isPolling
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

/**
 * POST /api/autonomous/generate-scripts
 * Generates real AI video scripts for a product using the Creator agent.
 * Called by the Video Factory page.
 */
router.post("/autonomous/generate-scripts", requireAuth, async (req: AuthRequest, res) => {
  const { productName, platform = "TikTok", count = 5, affiliateLink = "" } = req.body as {
    productName?: string;
    platform?: string;
    count?: number;
    affiliateLink?: string;
  };

  if (!productName) {
    res.status(400).json({ success: false, error: "productName مطلوب" });
    return;
  }

  try {
    // Find Creator agent
    const agents = await db.select().from(agentsTable).where(eq(agentsTable.status, "active"));
    const creator = agents.find(a => a.name.toLowerCase().includes("creator"));

    if (!creator) {
      res.status(404).json({ success: false, error: "لم يتم العثور على وكيل Creator. تحقق من صفحة AI Agents." });
      return;
    }

    const prompt = `أنت خبير تسويق رقمي ومتخصص في إنشاء محتوى تيك توك فيروسي.
    
مهمتك: اكتب ${count} سيناريو فيديو ${platform} احترافي ومختلف لترويج المنتج التالي:

**المنتج:** ${productName}
**رابط الأفلييت:** ${affiliateLink || "في البايو"}
**المنصة:** ${platform}

لكل سيناريو اكتب:
1. 🪝 الخطاف (Hook) - أول 3 ثوانٍ جذابة
2. 📝 النص الكامل - من 15 إلى 30 ثانية
3. 📢 الدعوة للفعل (CTA) - ختام مقنع
4. #️⃣ الهاشتاغات - 5 هاشتاغات رائجة

اكتب بأسلوب عربي جذاب وفيروسي. افصل كل سيناريو بخط ---`;

    const run = await agentManager.invoke(creator.id, { message: prompt }, req.user!.userId);

    res.json({
      success: true,
      agentName: creator.name,
      runId: run.id,
      status: run.status,
      scripts: run.output,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/autonomous/scan-trends
 * Uses TrendHunter agent to scan current trends for a niche.
 */
router.post("/autonomous/scan-trends", requireAuth, async (req: AuthRequest, res) => {
  const { niche = "AI tools", platform = "TikTok" } = req.body as {
    niche?: string;
    platform?: string;
  };

  try {
    const agents = await db.select().from(agentsTable).where(eq(agentsTable.status, "active"));
    const trendhunter = agents.find(a =>
      a.name.toLowerCase().includes("trend") || a.name.toLowerCase().includes("hunter")
    );

    if (!trendhunter) {
      res.status(404).json({ success: false, error: "لم يتم العثور على وكيل TrendHunter." });
      return;
    }

    const prompt = `أنت محلل تريندات خبير في منصة ${platform}.

مهمتك: ابحث وحلل أفضل التريندات الحالية لمجال "${niche}" على ${platform}.

أعطني:
1. 🔥 أفضل 10 هاشتاغات رائجة الآن مع نسبة انتشارها التقريبية
2. 📈 أفضل 5 أنواع محتوى تحقق أكبر وصول حالياً
3. ⏰ أفضل أوقات النشر (بتوقيت القاهرة/الرياض)
4. 💡 3 أفكار فيديو فيروسية جاهزة للتنفيذ
5. 🎯 الجمهور المستهدف الأكثر تفاعلاً

كن دقيقاً وعملياً. هذه المعلومات ستُستخدم مباشرة في حملات تسويقية حقيقية.`;

    const run = await agentManager.invoke(trendhunter.id, { message: prompt }, req.user!.userId);

    res.json({
      success: true,
      agentName: trendhunter.name,
      runId: run.id,
      status: run.status,
      trends: run.output,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/autonomous/agent-runs
 * Get the latest runs across all agents for the dashboard.
 */
router.get("/autonomous/agent-runs", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const runs = await db
      .select()
      .from(agentRunsTable)
      .orderBy(desc(agentRunsTable.startedAt))
      .limit(20);
    res.json({ runs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildAgentPrompt(
  agentName: string,
  campaign: {
    productName: string;
    platform: string;
    affiliateNetwork: string;
    affiliateLink: string;
    budget: number;
    revenue: number;
    conversions: number;
  }
): string {
  const name = agentName.toLowerCase();

  if (name.includes("creator")) {
    return `أنت وكيل صناعة محتوى محترف متخصص في تيك توك والتسويق بالعمولة.

حملتك النشطة الآن:
- المنتج: ${campaign.productName}
- المنصة: ${campaign.platform}
- الشبكة: ${campaign.affiliateNetwork}
- رابط الترويج: ${campaign.affiliateLink}
- الميزانية: $${campaign.budget}
- الأرباح الحالية: $${campaign.revenue}
- عدد المبيعات: ${campaign.conversions}

المطلوب منك الآن:
1. اكتب 3 سيناريوهات فيديو تيك توك جذابة (30 ثانية لكل فيديو) لترويج هذا المنتج
2. لكل سيناريو: خطاف قوي (Hook) + محتوى + CTA + هاشتاغات
3. اكتب بأسلوب عربي تسويقي مقنع يحفز المشاهد على الشراء فوراً
4. اقترح أفضل وقت نشر اليوم لتحقيق أكبر وصول`;
  }

  if (name.includes("trend") || name.includes("hunter")) {
    return `أنت وكيل تتبع التريندات الرقمية. تحليل فوري للحملة النشطة:

المنتج: ${campaign.productName} | المنصة: ${campaign.platform}

حلل وأخبرني:
1. أفضل 10 هاشتاغات رائجة الآن لهذا المنتج على ${campaign.platform}
2. أكثر أنواع محتوى تفاعلاً حالياً في مجال الكورسات الرقمية والذكاء الاصطناعي
3. منافسون ناجحون في هذا المجال وما الذي يميز محتواهم
4. توقعك لأفضل يوم وساعة للنشر هذا الأسبوع لتحقيق أكبر وصول`;
  }

  if (name.includes("ceo") || name.includes("brain")) {
    return `أنت المدير التنفيذي لنظام التسويق الآلي. حلل الأداء واتخذ القرارات:

حالة الحملة الحالية:
- المنتج: ${campaign.productName}
- الأرباح المحققة: $${campaign.revenue}
- عدد المبيعات: ${campaign.conversions}
- الميزانية المتبقية: $${campaign.budget}

تقريرك التنفيذي اليومي يجب أن يتضمن:
1. تقييم الأداء الحالي (ممتاز/جيد/ضعيف) مع السبب
2. الخطوات العملية الفورية لزيادة المبيعات خلال 24 ساعة
3. أولويات الوكلاء اليوم (من يفعل ماذا)
4. التوقع الواقعي للأرباح خلال الأسبوع القادم إذا تم تنفيذ خطتك`;
  }

  // Generic prompt for any other agent
  return `أنت وكيل ذكاء اصطناعي متخصص في التسويق الرقمي. 
حللة الحملة التالية وقدم توصياتك:
المنتج: ${campaign.productName} | المنصة: ${campaign.platform} | الأرباح: $${campaign.revenue}
قدم تقريراً مفيداً وعملياً يساعد على زيادة المبيعات.`;
}

export default router;
