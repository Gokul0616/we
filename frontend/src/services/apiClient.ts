/**
 * Global HTTP Client & Interceptor for all frontend API calls.
 * - Automatic headers & JWT bearer injection
 * - Configurable request timeout
 * - Request & response logging
 * - Unified error handling & typed responses
 */

import { toast } from "./toastService";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
  silent?: boolean;
}

export type RequestInterceptor = (config: RequestOptions & { url: string; headers: Record<string, string> }) => Promise<any> | any;
export type ResponseInterceptor = (data: any, response: Response) => Promise<any> | any;

class ApiClient {
  private authToken: string | null = null;
  private defaultTimeoutMs = 12000;
  private onUnauthorizedHandler?: () => void;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  public interceptors = {
    request: {
      use: (interceptor: RequestInterceptor) => {
        this.requestInterceptors.push(interceptor);
        return () => {
          this.requestInterceptors = this.requestInterceptors.filter((i) => i !== interceptor);
        };
      },
    },
    response: {
      use: (interceptor: ResponseInterceptor) => {
        this.responseInterceptors.push(interceptor);
        return () => {
          this.responseInterceptors = this.responseInterceptors.filter((i) => i !== interceptor);
        };
      },
    },
  };

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public setOnUnauthorized(handler: () => void) {
    this.onUnauthorizedHandler = handler;
  }

  /**
   * Core request method that runs request and response interceptors.
   */
  public async request<T = any>(endpointUrl: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = this.defaultTimeoutMs, params, headers: customHeaders, ...restOptions } = options;

    // --- 1. REQUEST INTERCEPTOR ---
    let url = endpointUrl;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined) searchParams.append(key, String(val));
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(customHeaders as Record<string, string>),
    };

    if (this.authToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const method = (restOptions.method || "GET").toUpperCase();
    const startTime = Date.now();

    // Run registered custom request interceptors
    for (const interceptor of this.requestInterceptors) {
      try {
        await interceptor({ ...options, url, headers });
      } catch (err) {
        console.warn("⚠️ [API REQ INTERCEPTOR ERR]", err);
      }
    }

    if (__DEV__) {
      console.log(`🌐 [API REQ] ${method} ${url}`, restOptions.body ? restOptions.body : "");
    }

    try {
      const response = await fetch(url, {
        ...restOptions,
        method,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latency = Date.now() - startTime;

      // --- 2. RESPONSE INTERCEPTOR ---
      let responseData: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json().catch(() => null);
      } else {
        responseData = await response.text().catch(() => null);
      }

      // Run registered custom response interceptors
      for (const interceptor of this.responseInterceptors) {
        try {
          const intercepted = await interceptor(responseData, response);
          if (intercepted !== undefined) {
            responseData = intercepted;
          }
        } catch (err) {
          console.warn("⚠️ [API RES INTERCEPTOR ERR]", err);
        }
      }

      if (__DEV__) {
        console.log(`✅ [API RES ${response.status}] ${method} ${url} (${latency}ms)`, responseData);
      }

      if (!response.ok) {
        if (response.status === 401 && this.onUnauthorizedHandler) {
          this.onUnauthorizedHandler();
        }

        const serverMessage =
          responseData?.detail ||
          responseData?.message ||
          (typeof responseData === "string" && responseData.length > 0
            ? responseData
            : `Request failed with status ${response.status}`);

        // Always show toast for server errors (>= 500) or when silent is not set
        const isServerError = response.status >= 500;
        if (!options.silent || isServerError) {
          toast.error(serverMessage);
        }

        throw new ApiError(serverMessage, response.status, responseData);
      }

      return responseData as T;
    } catch (err: any) {
      clearTimeout(timer);
      const latency = Date.now() - startTime;

      if (err.name === "AbortError") {
        const timeoutMsg = `Request to ${url} timed out after ${timeoutMs / 1000}s. Please check connection.`;
        console.log(`⏱️ [API TIMEOUT] ${method} ${url} timed out after ${timeoutMs}ms`);
        toast.error(timeoutMsg);
        throw new ApiError(timeoutMsg, 408);
      }

      if (__DEV__) {
        console.log(`❌ [API ERR] ${method} ${url} (${latency}ms):`, err?.message || err);
      }

      if (err instanceof ApiError) {
        throw err;
      }

      const netMsg = err?.message || "Network request failed. Ensure device and server are on the same network.";
      toast.error(netMsg);

      throw new ApiError(netMsg, 0, err);
    }
  }

  public get<T = any>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  public post<T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    });
  }

  public put<T = any>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    });
  }

  public delete<T = any>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
