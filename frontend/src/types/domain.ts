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
}

export interface Attendance {
  id: number;
  reservation_id: number;
  checked_in_at: string;
}

export interface Payment {
  id: number;
  client_id: number;
  amount: number;
  status: "pending" | "paid" | "failed";
  paid_at: string;
}

export interface DashboardSummary {
  total_clients: number;
  total_sessions: number;
  active_reservations: number;
  check_ins_today: number;
  monthly_revenue: number;
}
