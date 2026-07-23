import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface VideoJob {
  id: string;
  productName: string;
  hook: string;
  script: string;
  voice: string;
  template: string;
  music: string;
  duration: string;
  status: string;
  progress: number;
  platform: string;
  videoUrl?: string;
  publishedUrl?: string;
  errorMessage?: string;
  createdAt?: string;
}

export function useVideoProduction() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const showMsg = useCallback((msg: string, isError = false) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 5000);
    if (isError) console.error(msg);
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; jobs?: VideoJob[]; error?: string }>("/production/jobs");
      if (res.success && res.jobs) {
        setJobs(res.jobs);
      }
    } catch (e) {
      console.error("Failed to fetch production jobs:", e);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
    const interval = setInterval(() => void fetchJobs(), 6000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const refreshLiveStatus = async () => {
    setRefreshing(true);
    try {
      const res = await api.get<{ success: boolean; jobs?: VideoJob[]; error?: string }>("/production/jobs?_t=" + Date.now());
      if (res.success && res.jobs) {
        setJobs(res.jobs);
        showMsg("✅ تم تحديث حالة المهام من قاعدة البيانات بنجاح");
      } else {
        await fetchJobs();
      }
    } catch (e) {
      showMsg("⚠️ تعذر الاتصال بالخادم أثناء التحديث", true);
    } finally {
      setRefreshing(false);
    }
  };

  const deleteJob = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete("/production/jobs/" + id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      showMsg("🗑️ تم حذف المهمة بنجاح");
    } catch {
      showMsg("حدث خطأ أثناء الحذف", true);
    }
  };

  const clearAllJobs = async () => {
    try {
      await api.delete("/production/jobs");
      setJobs([]);
      showMsg("🗑️ تم تفريغ كافة سجلات الإنتاج بنجاح");
    } catch {
      showMsg("حدث خطأ أثناء التفريغ", true);
    }
  };

  const generate = async (params: {
    productName: string;
    platform: string;
    count: number;
    variationMode: string;
    videoStyle: string;
    avatarCharacter: string;
    videoEngine: string;
  }) => {
    if (!params.productName.trim()) return;
    setRunning(true);
    try {
      const res = await api.post<{ success: boolean; jobs?: VideoJob[]; error?: string }>("/production/generate-video-batch", params);

      if (!res.success || !res.jobs) {
        showMsg("فشل طلب التوليد: " + (res.error || "خطأ من الخادم"), true);
        return;
      }

      showMsg(`⚡ تم إطلاق ${res.jobs.length} فيديو للمنتج "${params.productName}" — جاري المعالجة في الخلفية`);
      await fetchJobs();
    } catch (err: any) {
      showMsg("حدث خطأ أثناء الاتصال بخادم الإنتاج: " + (err?.message || String(err)), true);
    } finally {
      setRunning(false);
    }
  };

  return {
    jobs,
    running,
    refreshing,
    statusMsg,
    showMsg,
    generate,
    refreshLiveStatus,
    deleteJob,
    clearAllJobs,
    fetchJobs,
  };
}
