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
  let response: Response;
  try {
    response = await fetch(withQuery(path, query), {
      ...init,
      headers: withDefaultHeaders(headers),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    const networkMessage =
      error instanceof Error && error.message
        ? error.message
        : "Khong the ket noi backend.";

    const apiError: ApiError = {
      message: `Khong the ket noi backend: ${networkMessage}`,
    };
    throw apiError;
  }

  const parsedBody = await parseResponseBody(response);

  if (!response.ok) {
    await handleApiError(response, parsedBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (typeof parsedBody === "string") {
    const apiError: ApiError = {
      message: `Phan hoi khong hop le tu backend (${response.status}).`,
      status: response.status,
    };
    throw apiError;
  }

  if (parsedBody === undefined || parsedBody === null) {
    const apiError: ApiError = {
      message: `Phan hoi rong tu backend (${response.status}).`,
      status: response.status,
    };
    throw apiError;
  }

  return parsedBody as T;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const raw = await response.text();
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function handleApiError(
  response: Response,
  parsedBody?: unknown,
): Promise<never> {
  let errorMessage = `Loi ${response.status}: Khong the thuc hien yeu cau`;

  if (response.status === 404) {
    errorMessage = "Khong tim thay du lieu.";
  } else if (response.status === 422) {
    errorMessage = "Du lieu khong hop le. Vui long kiem tra lai.";
  } else if (response.status >= 500) {
    errorMessage = "Loi server. Vui long thu lai sau.";
  }

  if (parsedBody && typeof parsedBody === "object") {
    const errorData = parsedBody as { detail?: unknown; message?: unknown };
    if (errorData.detail !== undefined && errorData.detail !== null) {
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const msg = (item as { msg?: unknown }).msg;
              return typeof msg === "string" ? msg : JSON.stringify(item);
            }
            return String(item);
          })
          .join("; ");
      } else if (typeof errorData.detail === "object") {
        errorMessage = JSON.stringify(errorData.detail);
      } else {
        errorMessage = String(errorData.detail);
      }
    } else if (typeof errorData.message === "string" && errorData.message) {
      errorMessage = errorData.message;
    }
  } else if (typeof parsedBody === "string" && parsedBody.trim().length > 0) {
    errorMessage = parsedBody;
  }

  const error: ApiError = {
    message: errorMessage,
    status: response.status,
  };

  throw error;
}
