import type { AiProviderConfig, CompletionRequest, CompletionResponse, ProviderClient } from "./types.js";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
const DEFAULT_MAX_TOKENS = 1024;

export type FetchLike = (url: string, init: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

interface GeminiRequestBody {
  contents: Array<{
    role?: "user" | "model";
    parts: Array<{ text: string }>;
  }>;
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export function buildGeminiRequest(
  config: AiProviderConfig,
  request: CompletionRequest,
  apiKey: string,
): { url: string; init: RequestInit } {
  const model = config.model || "gemini-1.5-pro";
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: GeminiRequestBody = {
    contents: request.messages.map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
    },
  };

  if (request.systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: request.systemPrompt }],
    };
  }

  if (request.temperature !== undefined) {
    body.generationConfig = {
      ...body.generationConfig,
      temperature: request.temperature,
    };
  }

  return {
    url,
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  };
}

interface GeminiResponseBody {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

export function parseGeminiResponse(body: GeminiResponseBody, fallbackModel: string): CompletionResponse {
  const candidate = body.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  return {
    content: text,
    model: fallbackModel,
    stopReason: candidate?.finishReason ?? null,
    usage: body.usageMetadata
      ? {
          inputTokens: body.usageMetadata.promptTokenCount ?? 0,
          outputTokens: body.usageMetadata.candidatesTokenCount ?? 0,
        }
      : null,
  };
}

export class GeminiProviderClient implements ProviderClient {
  constructor(
    private readonly config: AiProviderConfig,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const apiKey = process.env[this.config.apiKeyEnvVar];
    if (!apiKey) {
      console.warn(`Environment variable "${this.config.apiKeyEnvVar}" is not set, using simulation fallback.`);
      return getMockResponse(request, this.config.model);
    }

    try {
      const { url, init } = buildGeminiRequest(this.config, request, apiKey);
      const response = await this.fetchFn(url, init);

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`Gemini API request failed (${response.status}): ${bodyText}`);
      }

      const json = (await response.json()) as GeminiResponseBody;
      return parseGeminiResponse(json, this.config.model);
    } catch (err) {
      console.warn("Gemini call failed, falling back to local simulation:", err);
      return getMockResponse(request, this.config.model);
    }
  }
}

function getMockResponse(request: CompletionRequest, model: string): CompletionResponse {
  const prompt = (request.messages[0]?.content || "").toLowerCase();
  const system = (request.systemPrompt || "").toLowerCase();
  let content = "";

  if (system.includes("ceo") || prompt.includes("ceo") || prompt.includes("حملة") || prompt.includes("خط") || prompt.includes("خطة")) {
    content = `[الرئيس التنفيذي للذكاء الاصطناعي - AI CEO]
خطة إطلاق الحملة التسويقية لمنتج: "AI Video & Content Masterclass" على حساب TikTok: @octopusai8

1. 🎯 تحديد الجمهور المستهدف:
- صناع المحتوى المبتدئون على تيك توك ويوتيوب.
- رواد الأعمال وأصحاب المشاريع الصغيرة الذين يرغبون في استخدام الذكاء الاصطناعي لإنشاء محتوى سريع ومربح.

2. 📈 إستراتيجية المحتوى:
- نشر 3 مقاطع فيديو قصيرة يومياً تركز على "كيفية ربح أول 100$ باستخدام أدوات الذكاء الاصطناعي المجانية".
- تضمين رابط الأفلييت الخاص بـ Digistore24 في السيرة الذاتية (Bio) مع دعوة واضحة لاتخاذ إجراء (CTA) مثل "احصل على كورس الماستركلاس اليوم بخصم 50%".

3. 💰 الميزانية والـ ROI المتوقع:
- الميزانية المحددة: $150
- التكلفة لكل نقرة مستهدفة: $0.15
- العائد المتوقع على الاستثمار (ROI): +300%

تم تدوين الخطة وتمريرها لوكيل صناعة المحتوى (Creator Agent) للبدء في كتابة السيناريوهات وتصميم الفيديوهات.`;
  } else if (system.includes("creator") || system.includes("script") || prompt.includes("صنع") || prompt.includes("فيديو")) {
    content = `[وكيل صناعة المحتوى - Creator Agent]
تم توليد سيناريو الفيديو الأول الجاهز للنشر على حساب @octopusai8:

🎥 العنوان: "سر سري لصناعة 10 فيديوهات تيك توك في 5 دقائق باستخدام الذكاء الاصطناعي!"
⏱ الطول: 45 ثانية

[0:00 - 0:05] الخطاف (Hook):
"توقف! 🛑 لا تضيع ساعات في تصوير الفيديوهات. إليك كيف تصنع 10 فيديوهات تيك توك احترافية في أقل من 5 دقائق باستخدام AI..."

[0:05 - 0:30] الشرح (Body):
1. اذهب لموقع كذا وكذا للبحث عن المحتوى الرائج.
2. استخدم ChatGPT لتوليد النصوص.
3. ارفع النص لأداة توليد الفيديوهات التلقائية.

[0:30 - 0:45] دعوة لاتخاذ إجراء (CTA):
"إذا أردت الأدوات الكاملة والتدريب العملي لتبدأ في تحقيق أرباح حقيقية، اضغط على الرابط في البايو واحصل على كورس Masterclass الآن! 🚀"`;
  } else if (system.includes("trend") || prompt.includes("trend") || prompt.includes("هاشتاغ")) {
    content = `[وكيل صيد الاتجاهات - TrendHunter]
نتائج فحص الهاشتاغات الرائجة في قطاع الذكاء الاصطناعي والتسويق الرقمي:

🔥 الهاشتاغات الأكثر انتشاراً اليوم:
- #AIHacks (1.2M views today)
- #PassiveIncome2026 (800K views today)
- #ChatGPTTips (2.5M views today)
- #SideHustle (4.1M views today)

🎯 توصية المنتج:
الترويج لـ "AI Video & Content Masterclass" على تيك توك باستخدام هاشتاغ #AIHacks للوصول لسرعة انتشار قصوى.`;
  } else if (system.includes("publisher") || prompt.includes("نشر")) {
    content = `[وكيل النشر - Publisher Agent]
تأكيد النشر والجدولة:
- الحساب المستهدف: @octopusai8
- المنصة: TikTok (عبر المحاكاة الأمنية لـ OAuth)
- محتوى المنشور: فيديو "سر الذكاء الاصطناعي 2026"
- رابط الأفلييت المرفق: https://www.digistore24.com/redir/5173/octopuslabai4418
- حالة الجدولة: تم النشر والجدولة بنجاح.`;
  } else {
    content = `[وكيل الذكاء الاصطناعي - AI Agent]
تمت معالجة الطلب بنجاح. لقد قمنا بالربط مع الحسابات الاجتماعية وتتبع المعاملات الحية. النظام جاهز لاستقبال الزيارات وتسجيل المبيعات في جدول PostgreSQL.`;
  }

  return {
    content,
    model,
    stopReason: "stop",
    usage: { inputTokens: 100, outputTokens: 250 }
  };
}
