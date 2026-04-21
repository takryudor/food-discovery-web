import { ApiError } from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type AuthTokenResolver = () => string | null;

let resolveAuthToken: AuthTokenResolver = () => null;

const localStorageMockValue =
  typeof window !== "undefined" ? localStorage.getItem("USE_MOCK_DATA") : null;

let USE_MOCK_DATA =
  localStorageMockValue !== null ? localStorageMockValue === "true" : true;

export function setUseMockData(value: boolean) {
  USE_MOCK_DATA = value;
  if (typeof window !== "undefined") {
    localStorage.setItem("USE_MOCK_DATA", value.toString());
  }
}

export function getUseMockData(): boolean {
  return USE_MOCK_DATA;
}

export function isMockDataEnabled(): boolean {
  return USE_MOCK_DATA;
}

export function setAuthTokenResolver(resolver: AuthTokenResolver) {
  resolveAuthToken = resolver;
}

interface ApiFetchOptions extends Omit<RequestInit, "body" | "headers"> {
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: HeadersInit;
}

function withQuery(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!query) return `${API_BASE_URL}${path}`;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString
    ? `${API_BASE_URL}${path}?${queryString}`
    : `${API_BASE_URL}${path}`;
}

function withDefaultHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  if (!merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }

  const token = resolveAuthToken();
  if (token && !merged.has("Authorization")) {
    merged.set("Authorization", `Bearer ${token}`);
  }

  return merged;
}

export async function apiFetch<T>(options: ApiFetchOptions): Promise<T> {
  const { path, query, body, headers, ...init } = options;
  const response = await fetch(withQuery(path, query), {
    ...init,
    headers: withDefaultHeaders(headers),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `Loi ${response.status}: Khong the thuc hien yeu cau`;

  if (response.status === 404) {
    errorMessage = "Khong tim thay du lieu.";
  } else if (response.status === 422) {
    errorMessage = "Du lieu khong hop le. Vui long kiem tra lai.";
  } else if (response.status >= 500) {
    errorMessage = "Loi server. Vui long thu lai sau.";
  }

  try {
    const errorData = await response.json();
    if (errorData.detail) {
      errorMessage = errorData.detail;
    }
  } catch {
    // Ignore JSON parse error.
  }

  const error: ApiError = {
    message: errorMessage,
    status: response.status,
  };

  throw error;
}
