import { storage } from "../lib/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = storage.getToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers
    });
  } catch {
    throw new Error("No se pudo conectar con el backend");
  }

  if (!response.ok) {
    if (response.status === 401) {
      storage.clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    let message = "Request failed";
    try {
      const body = (await response.json()) as { detail?: string };
      if (body?.detail) message = body.detail;
    } catch {
      const fallback = await response.text();
      if (fallback) message = fallback;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
