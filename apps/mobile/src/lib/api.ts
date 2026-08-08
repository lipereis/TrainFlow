const DEFAULT_API_URL = "https://trainflow-chi.vercel.app";

export function getApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  return (configured ?? DEFAULT_API_URL).replace(/\/$/, "");
}

export function buildApiRequest(
  path: string,
  token: string | null,
  init: RequestInit = {},
): { url: string; init: RequestInit } {
  const url = `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { url, init: { ...init, headers } };
}

export async function apiFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const { url, init: requestInit } = buildApiRequest(path, token, init);
  const res = await fetch(url, requestInit);
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
