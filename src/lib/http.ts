// Shared HTTP client for the Second Home API.
// - Unwraps the { success, message, data } envelope and returns `data`.
// - Injects the bearer token, and transparently refreshes it once on 401.
// - Throws a typed ApiError that features can surface to the user.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const ACCESS_KEY = "sh_access_token";
const REFRESH_KEY = "sh_refresh_token";

// ── Token storage (SSR-safe) ──
export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string | null, refresh: string | null) {
    if (typeof window === "undefined") return;
    if (access) window.localStorage.setItem(ACCESS_KEY, access);
    else window.localStorage.removeItem(ACCESS_KEY);
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
    else window.localStorage.removeItem(REFRESH_KEY);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export type FieldError = { field?: string; message: string };

export class ApiError extends Error {
  status: number;
  errors?: FieldError[];
  code?: string; // backend machine-readable code, e.g. "EMAIL_NOT_VERIFIED"
  constructor(message: string, status: number, errors?: FieldError[], code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

type RequestOptions = {
  body?: unknown;
  auth?: boolean; // attach bearer token (default true)
  signal?: AbortSignal;
  isForm?: boolean; // body is FormData
  _retry?: boolean;
};

async function rawRefresh(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const data = json?.data;
    if (data?.accessToken) {
      tokenStore.set(data.accessToken, data.refreshToken ?? refresh);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function request<T = unknown>(
  method: string,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, signal, isForm = false } = opts;

  const headers: Record<string, string> = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    signal,
    body: body == null ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  // Try a single transparent refresh on auth failure.
  if (res.status === 401 && auth && !opts._retry) {
    const ok = await rawRefresh();
    if (ok) return request<T>(method, path, { ...opts, _retry: true });
    tokenStore.clear();
  }

  let json:
    | { success?: boolean; message?: string; data?: T; errors?: FieldError[]; code?: string }
    | null = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok || (json && json.success === false)) {
    throw new ApiError(
      json?.message || `Request failed (${res.status})`,
      res.status,
      json?.errors ?? undefined,
      json?.code ?? undefined,
    );
  }

  return (json?.data as T) ?? (undefined as T);
}

// List endpoints return either a bare array or { <key>: [], ...pagination }.
export function unwrapList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  const obj = data as Record<string, unknown> | null;
  const arr = obj?.[key];
  return Array.isArray(arr) ? (arr as T[]) : [];
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, { ...opts, body }),
  del: <T>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, opts),
};
