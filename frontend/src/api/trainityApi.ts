import { apiFetch } from "./http";
import type {
  Appointment,
  ClassSession,
  Client,
  CreateAppointmentPayload,
  CreateClientPayload,
  CreateReservationPayload,
  DashboardSummary,
  Doctor,
  Patient,
  Reservation,
  UpdateAppointmentPayload,
  UpdateClientPayload
} from "../types/domain";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const trainityApi = {
  login: async (email: string, password: string) => {
    const body = new URLSearchParams();
    body.append("username", email.trim());
    body.append("password", password);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      let message = "Email o contraseña inválidos";

      try {
        const errorData = await res.json();

        if (typeof errorData?.detail === "string") {
          message = errorData.detail;
        } else if (Array.isArray(errorData?.detail)) {
          message = errorData.detail
            .map((item: { msg?: string }) => item.msg ?? "Error de validación")
            .join(", ");
        }
      } catch {
        //
      }

      throw new Error(message);
    }

    return (await res.json()) as {
      access_token: string;
      token_type: string;
    };
  },

  getDashboard: () => apiFetch<DashboardSummary>("/dashboard/summary"),

  getClients: (params?: { search?: string; isActive?: boolean; gymId?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (typeof params?.isActive === "boolean") {
      query.set("is_active", String(params.isActive));
    }
    if (typeof params?.gymId === "number") {
      query.set("gym_id", String(params.gymId));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<Client[]>(`/clients${suffix}`);
  },

  createClient: (payload: CreateClientPayload) =>
    apiFetch<Client>("/clients", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateClient: (clientId: number, payload: UpdateClientPayload) =>
    apiFetch<Client>(`/clients/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getSessions: () => apiFetch<ClassSession[]>("/sessions"),

  getReservations: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<Reservation[]>(`/reservations${suffix}`);
  },

  cancelReservation: (id: number) =>
    apiFetch(`/reservations/${id}/cancel`, { method: "PUT" }),

  createReservation: (payload: CreateReservationPayload) =>
    apiFetch<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAppointments: (params?: {
    patient_id?: number;
    doctor_id?: number;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.patient_id) query.set("patient_id", String(params.patient_id));
    if (params?.doctor_id) query.set("doctor_id", String(params.doctor_id));
    if (params?.status) query.set("status_filter", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<Appointment[]>(`/appointments${suffix}`);
  },

  getAppointment: (id: number) => apiFetch<Appointment>(`/appointments/${id}`),

  createAppointment: (payload: CreateAppointmentPayload) =>
    apiFetch<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateAppointment: (id: number, payload: UpdateAppointmentPayload) =>
    apiFetch<Appointment>(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getPatients: (params?: { search?: string; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (typeof params?.isActive === "boolean") {
      query.set("is_active", String(params.isActive));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<Patient[]>(`/patients${suffix}`);
  },

  getDoctors: (params?: { isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (typeof params?.isActive === "boolean") {
      query.set("is_active", String(params.isActive));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<Doctor[]>(`/doctors${suffix}`);
  },

  //  Endpoints filtrados por usuario logueado
  getMyAppointments: () => apiFetch<Appointment[]>("/citas/mis-citas"),

  getMyPatients: () => apiFetch<Patient[]>("/pacientes/mis-pacientes"),
};
