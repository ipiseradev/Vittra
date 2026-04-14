import { apiFetch } from "./http";
import type {
  ClassSession,
  Client,
  CreateClientPayload,
  DashboardSummary,
  Reservation,
  UpdateClientPayload
} from "../types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const trainityApi = {
  login: async (email: string, password: string) => {
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    if (!res.ok) throw new Error("Invalid credentials");
    return (await res.json()) as { access_token: string; token_type: string };
  },
  getDashboard: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  getClients: (params?: { search?: string; isActive?: boolean; gymId?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (typeof params?.isActive === "boolean") query.set("is_active", String(params.isActive));
    if (typeof params?.gymId === "number") query.set("gym_id", String(params.gymId));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<Client[]>(`/clients${suffix}`);
  },
  createClient: (payload: CreateClientPayload) =>
    apiFetch<Client>("/clients", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateClient: (clientId: number, payload: UpdateClientPayload) =>
    apiFetch<Client>(`/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getSessions: () => apiFetch<ClassSession[]>("/sessions"),
  getReservations: () => apiFetch<Reservation[]>("/reservations")
};
