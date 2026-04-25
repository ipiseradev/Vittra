export interface Client {
  id: number;
  gym_id?: number | null;
  full_name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientPayload {
  full_name: string;
  email: string;
  phone?: string;
  gym_id?: number | null;
  is_active?: boolean;
}

export interface UpdateClientPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  gym_id?: number | null;
  is_active?: boolean;
}

export interface ClassSession {
  id: number;
  title: string;
  coach_name: string;
  starts_at: string;
  capacity: number;
}

export interface Reservation {
  id: number;
  client_id: number;
  class_session_id: number;
  status: "booked" | "cancelled" | "checked_in";
  client_name: string;
  class_title: string;
  created_at: string;
}

export interface Attendance {
  id: number;
  reservation_id: number;
  checked_in_at: string;
}

export interface CreateReservationPayload {
  client_id: number;
  class_session_id: number;
}

export interface Payment {
  id: number;
  client_id: number;
  amount: number;
  status: "pending" | "paid" | "failed";
  paid_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_type: "consultation" | "follow_up" | "procedure" | "checkup";
  status: "scheduled" | "completed" | "cancelled" | "no_show" | "rescheduled";
  scheduled_at: string;
  duration_minutes: number;
  notes?: string | null;
  room?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentPayload {
  patient_id: number;
  doctor_id: number;
  appointment_type?: "consultation" | "follow_up" | "procedure" | "checkup";
  scheduled_at: string;
  duration_minutes?: number;
  notes?: string;
  room?: string;
}

export interface UpdateAppointmentPayload {
  appointment_type?: "consultation" | "follow_up" | "procedure" | "checkup";
  status?: "scheduled" | "completed" | "cancelled" | "no_show" | "rescheduled";
  scheduled_at?: string;
  duration_minutes?: number;
  notes?: string;
  room?: string;
  cancellation_reason?: string;
}

export interface Patient {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | null;
  document_id?: string | null;
  insurance_id?: string | null;
  insurance_provider?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AssistantProvider = "auto" | "openai" | "anthropic" | "demo";

export interface PatientAssistantContext {
  patient_id: number;
  full_name: string;
  patient: Record<string, unknown>;
  recent_medical_records: Record<string, unknown>[];
  upcoming_appointments: Record<string, unknown>[];
  generated_at?: string | null;
}

export interface PatientAssistantChatResponse {
  provider_requested: AssistantProvider;
  provider_used: AssistantProvider;
  model: string;
  fallback_used: boolean;
  system_prompt: string;
  patient_context: PatientAssistantContext;
  reply: string;
  error?: string | null;
}

export interface Doctor {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "doctor" | "nurse" | "receptionist" | "patient";
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_clients: number;
  total_sessions: number;
  active_reservations: number;
  check_ins_today: number;
  monthly_revenue: number;
}
