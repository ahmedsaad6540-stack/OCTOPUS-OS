// API base — uses the real backend in production, falls back to /api for local dev
const isDev = import.meta.env.DEV;
const fallbackUrl = isDev ? "http://localhost:5002" : "https://api-server-production-4801.up.railway.app";
const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || fallbackUrl;
export const API_BASE = envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;

function getToken(): string | null {
  return localStorage.getItem("octopus_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return {} as T;
  }

  const data = (await res.json()) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new Error(
      (data as { message?: string; error?: string }).message ??
        (data as { error?: string }).error ??
        "Request failed"
    );
  }
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown = {}) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown = {}) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
