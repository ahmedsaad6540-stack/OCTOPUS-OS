import { API_BASE } from "@/lib/api";
import { ApiError, AuthenticationError } from "./Errors";
import { Logger } from "./Logger";

interface FetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean>;
}

export class ApiClient {
  constructor(private readonly baseUrl: string = API_BASE) {}

  public async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public async post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", body: data ? JSON.stringify(data) : undefined });
  }

  public async put<T>(endpoint: string, data: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(data) });
  }

  public async patch<T>(endpoint: string, data: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(data) });
  }

  public async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  private async request<T>(endpoint: string, options: FetchOptions): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;

    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && typeof options.body === "string") {
      headers.set("Content-Type", "application/json");
    }
    if (options.token) {
      headers.set("Authorization", `Bearer ${options.token}`);
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(errorData.error || errorData.message || `HTTP Error ${response.status}`, response.status);
      }
      
      // Handle empty responses
      const text = await response.text();
      return text ? JSON.parse(text) : {} as T;
    } catch (err: any) {
      Logger.error(`API Request Failed: ${options.method} ${endpoint}`, err);
      if (err instanceof ApiError || err instanceof AuthenticationError) {
        throw err;
      }
      throw new ApiError(err.message || "Network Error");
    }
  }
}

export const apiClient = new ApiClient();
