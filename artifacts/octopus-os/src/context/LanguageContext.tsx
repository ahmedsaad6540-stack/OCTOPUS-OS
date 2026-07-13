import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ar";

interface LanguageCtx {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Sidebar
    homeWorkspace: "Command Center",
    aiAgents: "AI Agents",
    aiWorkforce: "AI Workforce",
    memoryEngine: "Memory Engine",
    promptStudio: "Prompt Studio",
    videoFactory: "Video Factory",
    workflowBuilder: "Workflow Builder",
    aiMarketplace: "AI Marketplace",
    aiProviders: "AI Providers",
    socialHub: "Social Hub",
    affiliateHub: "Affiliate Hub",
    integrations: "Integrations",
    analytics: "Analytics",
    campaigns: "Campaigns",
    identityCenter: "Identity Center",
    billing: "Billing",
    deployment: "Deployment",
    saasMode: "SaaS Mode",
    securityCenter: "Security Center",
    settings: "Settings",
    logout: "Logout",
    osCore: "OS CORE",
    creation: "CREATION",
    connectGroup: "CONNECT",
    business: "BUSINESS",
    platform: "PLATFORM",
    
    // Common
    live: "Live",
    signOut: "Sign Out",
    welcomeBack: "Welcome back",
    admin: "ADMIN",
    save: "Save Changes",
    saveConfig: "Save Configuration",
    saveCredentials: "Save Credentials",
    saveKeys: "Save Keys",
    connect: "Connect",
    disconnect: "Disconnect",
    testConnection: "Test Connection",
    test: "Test",
    testing: "Testing...",
    config: "Config",
    status: "Status",
    active: "Active",
    paused: "Paused",
    disabled: "Disabled",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    
    // Command Center
    totalRevenue: "Total Revenue",
    roi: "ROI",
    activeCampaigns: "Active Campaigns",
    activeAgents: "Active Agents",
    systemStatus: "System Status",
    profitSnapshot: "Profit Snapshot",
    healthy: "healthy",
    advancedOperations: "Advanced AI Control Operations",
    openAdvanced: "▼ Open Advanced AI Control Operations",
    hideAdvanced: "▲ Hide Advanced AI Control Operations",
    startAuto: "⚡ Start Autonomous Mode",
    pauseAuto: "⏸ Pause Autonomous Mode",
    ceoBriefing: "AI CEO Daily Briefing",
    ceoBriefingText: "System initialized. TikTok trend index reveals high engagement on productivity niches. Recommended campaign coordinates synced to affiliates dashboard. Ready to deploy first automation.",
    api: "Api",
    database: "Database",
    workers: "Workers",
    epc: "EPC",
    cvr: "CVR",
    
    // Mission Control
    missionControlRoom: "Mission Control Room",
    pipelinesActive: "PIPELINES ACTIVE",
    missionControlDesc: "Manage active agent pipelines, scheduled automation cron jobs, and telemetry logs.",
    abortAll: "🛑 Emergency Abort All",
    activePipelines: "Active Pipelines",
    queuedTasks: "Queued Tasks",
    activeCronJobs: "Active Cron Jobs",
    taskSuccessRate: "Task Success Rate",
    activeExecution: "Active Pipeline Execution",
    executor: "Executor",
    workflowAutomations: "Workflow Automations",
    scheduledJobs: "Scheduled Jobs (Cron)",
    liveTerminal: "Live Telemetry Terminal",
    
    // AI Workforce
    aiWorkforcePanel: "AI Workforce Panel",
    workforceDesc: "Configure and manage active virtual agents, adjust operational instructions, and monitor worker loads.",
    restoreDefault: "🔄 Restore Default Workforce",
    currentJob: "Current Job",
    executionPrompt: "Execution Prompt",
    performance: "Performance",
    memoryContext: "Memory context",
    clone: "Clone",
    delete: "Delete",
    resume: "Resume",
    
    // AI Brain
    aiBrainEmbeddings: "AI Brain & Vector Memory",
    brainDesc: "Explore semantic long-term memory embeddings, relation graphs, decision trails, and prompt vectors.",
    semanticSearch: "Semantic Vector Search",
    searchPlaceholder: "Search vector database (e.g. 'tiktok engagement times')...",
    searchBtn: "Search",
    searching: "Searching...",
    memoryStatus: "Memory Engine Status",
    vectorCount: "Vector Count",
    dimensions: "Dimensions",
    indexType: "Index Type",
    lastSync: "Last Sync",
    semanticGraph: "Semantic Knowledge Graph",
    decisionTrail: "Decision Trail",
    promptLibrary: "Prompt Vector Library",
    openConfig: "Open Config",
    
    // AI Chat
    aiChatSessions: "AI Chat Sessions",
    newChat: "+ New",
    chatConsole: "Chat Console",
    chatDesc: "Interact directly with primary AI context models.",
    model: "Model",
    reasoning: "AI Reasoning Thoughts",
    askAnything: "Ask model anything...",
    send: "Send",
    thinking: "is thinking...",
    
    // Analytics
    analyticsTitle: "System & Business Analytics",
    analyticsDesc: "Monitor revenue metrics and live server resource consumption.",
    businessPerformance: "Business Performance",
    systemObservability: "System Observability Vitals",
    totalClicks: "Total Clicks",
    conversions: "Conversions",
    avgRoi: "Avg ROI",
    revenue7d: "Revenue — Last 7 Days",
    byPlacement: "By Placement",
    clicks7d: "Clicks — Last 7 Days",
    requestsToday: "API Requests Today",
    tokenConsumption: "Token Consumption",
    cpuLoad: "CPU Load (Average)",
    memoryFootprint: "Memory Footprint",
    latency7d: "Average API Latency (ms)",
    
    // Settings
    settingsPanel: "Settings Panel",
    profileSettings: "Profile Settings",
    appearance: "Appearance",
    notifications: "Notifications",
    workspace: "Workspace",
    securityKeys: "Security & Keys",
    changeAvatar: "Change Avatar",
    fullName: "Full Name",
    emailAddress: "Email Address",
    roleTitle: "Role Title",
    organization: "Organization",
    colorTheme: "Color Theme Palette",
    interfaceFont: "Interface Font Face",
    animationsToggle: "Animations & Micro-interactions",
    animationsDesc: "Toggle transitions, progress flows, and live log updates.",
    notificationChannels: "Notification Channels",
    dangerZone: "⚠️ High-Risk Action Zone",
    dangerZoneDesc: "Resetting data clears cached telemetry settings, connection tokens, and memory search histories. This cannot be undone.",
    deleteLogs: "Delete Workspace Logs",
    resetConfig: "Reset System Config",
    encryptionKeys: "Encryption & Keys",
    encryptionKeysDesc: "Configure primary keys for vector stores and external webhook signatures.",
  },
  ar: {
    // Sidebar
    homeWorkspace: "لوحة التحكم",
    aiAgents: "العملاء الذكيين",
    aiWorkforce: "فريق العمل الذكي",
    memoryEngine: "محرك الذاكرة",
    promptStudio: "استوديو الأوامر",
    videoFactory: "مصنع الفيديو",
    workflowBuilder: "منشئ سير العمل",
    aiMarketplace: "سوق الذكاء الاصطناعي",
    aiProviders: "مزودي الذكاء الاصطناعي",
    socialHub: "المركز الاجتماعي",
    affiliateHub: "مركز التسويق",
    integrations: "تكامل الخدمات",
    analytics: "التحليلات",
    campaigns: "الحملات الإعلانية",
    identityCenter: "مركز الهوية",
    billing: "الفواتير والاشتراكات",
    deployment: "لوحة النشر والتركيب",
    saasMode: "نظام الـ SaaS",
    securityCenter: "مركز الحماية والأمان",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    osCore: "نواة النظام (OS CORE)",
    creation: "الإنشاء (CREATION)",
    connectGroup: "الاتصال (CONNECT)",
    business: "إدارة الأعمال (BUSINESS)",
    platform: "المنصة (PLATFORM)",
    
    // Common
    live: "مباشر",
    signOut: "تسجيل الخروج",
    welcomeBack: "مرحباً بك من جديد",
    admin: "مدير النظام",
    save: "حفظ التغييرات",
    saveConfig: "حفظ الإعدادات",
    saveCredentials: "حفظ البيانات",
    saveKeys: "حفظ المفاتيح",
    connect: "اتصال",
    disconnect: "قطع الاتصال",
    testConnection: "فحص الاتصال",
    test: "فحص",
    testing: "جاري الفحص...",
    config: "تعديل",
    status: "الحالة",
    active: "نشط",
    paused: "موقوف مؤقتاً",
    disabled: "معطل",
    running: "جاري التشغيل",
    completed: "مكتمل",
    failed: "فشل",
    
    // Command Center
    totalRevenue: "إجمالي الأرباح",
    roi: "العائد على الاستثمار",
    activeCampaigns: "الحملات النشطة",
    activeAgents: "الوكلاء النشطين",
    systemStatus: "حالة النظام",
    profitSnapshot: "لمحة الأرباح",
    healthy: "سليم",
    advancedOperations: "عمليات التحكم المتقدمة بالـ AI",
    openAdvanced: "▼ فتح لوحة التحكم المتقدمة بالـ AI",
    hideAdvanced: "▲ إغلاق لوحة التحكم المتقدمة بالـ AI",
    startAuto: "⚡ بدء التشغيل الذاتي",
    pauseAuto: "⏸ إيقاف التشغيل الذاتي",
    ceoBriefing: "التقرير اليومي للمدير التنفيذي AI",
    ceoBriefingText: "تم تشغيل النظام بنجاح. تكشف إحصاءات TikTok عن تفاعل عالٍ في مجال الإنتاجية. تم دمج إحداثيات الحملة الموصى بها في لوحة أرباح الشبكات. جاهز لتطبيق أول عملية أوتوماتيكية بالكامل.",
    api: "واجهة البرمجة (API)",
    database: "قاعدة البيانات",
    workers: "المعالجات (Workers)",
    epc: "الأرباح لكل نقرة (EPC)",
    cvr: "نسبة التحويل (CVR)",
    
    // Mission Control
    missionControlRoom: "غرفة العمليات المركزية",
    pipelinesActive: "خطوط المعالجة نشطة",
    missionControlDesc: "إدارة خطوط المعالجة الفعالة، والمهام المجدولة (Cron)، وسجلات التنبؤ والتحليل.",
    abortAll: "🛑 إيقاف اضطراري شامل",
    activePipelines: "خطوط المعالجة النشطة",
    queuedTasks: "المهام المنتظرة",
    activeCronJobs: "المهام المجدولة النشطة",
    taskSuccessRate: "معدل نجاح العمليات",
    activeExecution: "معالجة خطوط المهام الحية",
    executor: "المنفذ",
    workflowAutomations: "سير عمل الأتمتة",
    scheduledJobs: "المهام المجدولة (Cron)",
    liveTerminal: "شاشة التحكم والبيانات الفورية",
    
    // AI Workforce
    aiWorkforcePanel: "لوحة فريق العمل الذكي",
    workforceDesc: "إعداد وإدارة الوكلاء الافتراضيين، تعديل تعليمات التشغيل، ومراقبة استهلاك المعالجات.",
    restoreDefault: "🔄 استعادة فريق العمل الافتراضي",
    currentJob: "المهمة الحالية",
    executionPrompt: "موجه التشغيل (Instructions)",
    performance: "الكفاءة",
    memoryContext: "سياق الذاكرة",
    clone: "نسخ",
    delete: "حذف",
    resume: "استئناف",
    
    // AI Brain
    aiBrainEmbeddings: "العقل الاصطناعي وذاكرة الـ Vector",
    brainDesc: "استكشف سياق الذاكرة طويلة المدى، شبكة العلاقات المعرفية، وسجل القرارات وموجهات المهام.",
    semanticSearch: "البحث الدلالي في الذاكرة",
    searchPlaceholder: "ابحث في قاعدة بيانات الذاكرة (مثال: 'أوقات تفاعل تيك توك')...",
    searchBtn: "بحث",
    searching: "جاري البحث...",
    memoryStatus: "حالة محرك الذاكرة",
    vectorCount: "عدد الـ Vectors",
    dimensions: "الأبعاد",
    indexType: "نوع المؤشر",
    lastSync: "آخر مزامنة",
    semanticGraph: "الرسم المعرفي الدلالي",
    decisionTrail: "سجل قرارات العقل الاصطناعي",
    promptLibrary: "مكتبة موجهات المهام",
    openConfig: "فتح التكوين",
    
    // AI Chat
    aiChatSessions: "جلسات المحادثة الذكية",
    newChat: "+ جديد",
    chatConsole: "لوحة المحادثة",
    chatDesc: "تفاعل وتحدث مباشرة مع نماذج الذكاء الاصطناعي الرئيسية.",
    model: "النموذج",
    reasoning: "خطوات تفكير الذكاء الاصطناعي",
    askAnything: "اسأل النموذج أي شيء...",
    send: "إرسال",
    thinking: "يفكر الآن...",
    
    // Analytics
    analyticsTitle: "التحليلات ومراقبة الموارد",
    analyticsDesc: "مراقبة إحصاءات الأرباح واستهلاك موارد الخادم الفورية.",
    businessPerformance: "إحصاءات الأرباح والأعمال",
    systemObservability: "مراقبة موارد النظام والـ AI",
    totalClicks: "إجمالي النقرات",
    conversions: "التحويلات الناجحة",
    avgRoi: "متوسط العائد",
    revenue7d: "الأرباح خلال آخر 7 أيام",
    byPlacement: "أرباح المنصات والقنوات",
    clicks7d: "النقرات خلال آخر 7 أيام",
    requestsToday: "الطلبات اليومية (API)",
    tokenConsumption: "معدل استهلاك الـ Tokens",
    cpuLoad: "استهلاك المعالج (CPU)",
    memoryFootprint: "مساحة الذاكرة المستهلكة",
    latency7d: "متوسط زمن الاستجابة (ms)",
    
    // Settings
    settingsPanel: "لوحة الإعدادات",
    profileSettings: "إعدادات الملف الشخصي",
    appearance: "المظهر والسمات",
    notifications: "التنبيهات",
    workspace: "مساحة العمل",
    securityKeys: "الأمان والمفاتيح API",
    changeAvatar: "تغيير الصورة",
    fullName: "الاسم الكامل",
    emailAddress: "البريد الإلكتروني",
    roleTitle: "المسمى الوظيفي",
    organization: "المؤسسة",
    colorTheme: "سمة الألوان",
    interfaceFont: "خط الواجهة",
    animationsToggle: "تفعيل المؤثرات الحركية",
    animationsDesc: "تفعيل الرسوم الانتقالية وتدفق سجلات البيانات الحية.",
    notificationChannels: "قنوات الإشعارات",
    dangerZone: "⚠️ منطقة الإجراءات الخطيرة",
    dangerZoneDesc: "إعادة ضبط النظام تقوم بمسح جميع التنبيهات المؤقتة، ومفاتيح الربط، وسجل الذاكرة. لا يمكن التراجع عن هذا الإجراء.",
    deleteLogs: "حذف سجلات مساحة العمل",
    resetConfig: "إعادة ضبط النظام بالكامل",
    encryptionKeys: "التشفير ومفاتيح الربط",
    encryptionKeysDesc: "تهيئة مفاتيح التشفير الأساسية لقواعد بيانات الذاكرة وربط الويب هوكس.",
  }
};

const LanguageContext = createContext<LanguageCtx>({} as LanguageCtx);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("octopus_language");
      return (saved === "ar" || saved === "en" ? saved : "en") as Language;
    } catch {
      return "en";
    }
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem("octopus_language", lang);
    setLanguageState(lang);
  };

  useEffect(() => {
    // Dynamic RTL/LTR switching on <html> tag
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    
    // Toggle font family class if needed
    if (language === "ar") {
      document.documentElement.style.setProperty("--font-sans", "'Sora', 'Inter', sans-serif");
    } else {
      document.documentElement.style.setProperty("--font-sans", "'Inter', sans-serif");
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
