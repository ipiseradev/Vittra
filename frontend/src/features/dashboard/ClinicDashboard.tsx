import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Users,
  ArrowUpRight,
  Activity,
  Wallet,
  Plus,
  User,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { trainityApi } from "../../api/trainityApi";
import type { Client, Appointment } from "../../types/domain";
import { storage } from "../../lib/storage";

type UserData = {
  name: string;
  role: string;
  initials: string;
};

type PanelType = "appointment" | "patient" | null;

type AppointmentFormState = {
  patient: string;
  scheduledAt: string;
  appointmentType: string;
  notes: string;
};

type PatientFormState = {
  fullName: string;
  email: string;
  phone: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function decodeToken(token: string): UserData | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const name = payload.sub || payload.name || "Usuario";
    const role = payload.role || "user";
    return { name, role, initials: getInitials(name as string) };
  } catch {
    return null;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusConfig(status: string) {
  const config = {
    scheduled: {
      label: "Programada",
      className: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    },
    completed: {
      label: "Completada",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    },
    cancelled: {
      label: "Cancelada",
      className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    },
    no_show: {
      label: "No asistió",
      className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    },
    rescheduled: {
      label: "Reagendada",
      className: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    },
  };

  return config[status as keyof typeof config] || {
    label: status,
    className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };
}

function getRoleLabel(role: string): string {
  const roles: Record<string, string> = {
    admin: "Administrador de la clínica",
    doctor: "Médico",
    nurse: "Enfermería",
    receptionist: "Recepción",
    user: "Usuario",
  };
  return roles[role] || role;
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <User className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  helper,
  tone,
  icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  tone: "emerald" | "blue" | "violet" | "orange";
  icon: React.ReactNode;
}) {
  const toneMap = {
    emerald: {
      soft: "bg-emerald-50",
      icon: "text-emerald-600",
      helper: "text-emerald-600",
    },
    blue: {
      soft: "bg-blue-50",
      icon: "text-blue-600",
      helper: "text-blue-600",
    },
    violet: {
      soft: "bg-violet-50",
      icon: "text-violet-600",
      helper: "text-violet-600",
    },
    orange: {
      soft: "bg-orange-50",
      icon: "text-orange-600",
      helper: "text-orange-600",
    },
  };

  const palette = toneMap[tone];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${palette.soft}`}>
          <div className={palette.icon}>{icon}</div>
        </div>
      </div>
      <div
        className={`flex items-center gap-2 text-xs font-semibold ${palette.helper}`}
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
        <span>{helper}</span>
      </div>
    </div>
  );
}

type DailyActivityData = {
  day: string;
  citations: number;
  clients: number;
};

function PanelInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}

function PanelSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}

function PanelTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}

export function ClinicDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    name: "Usuario",
    role: "user",
    initials: "U",
  });
  const [panel, setPanel] = useState<PanelType>(null);

  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>({
    patient: "",
    scheduledAt: "",
    appointmentType: "Consulta general",
    notes: "",
  });

  const [patientForm, setPatientForm] = useState<PatientFormState>({
    fullName: "",
    email: "",
    phone: "",
  });

  const dailyActivityData: DailyActivityData[] = useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    return days.map((day, index) => ({
      day,
      citations: Math.floor(Math.random() * 15) + 5 + index,
      clients: Math.floor(Math.random() * 8) + 2 + (index % 3),
    }));
  }, []);

  useEffect(() => {
    const token = storage.getToken();
    const decoded = token ? decodeToken(token) : null;
    if (decoded) setUserData(decoded);
  }, []);

  useEffect(() => {
    document.body.style.overflow = panel ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [panel]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clts, apts] = await Promise.all([
          trainityApi.getClients({ isActive: true }).catch(() => []),
          trainityApi.getAppointments().catch(() => []),
        ]);
        setClients(clts || []);
        setAppointments(apts || []);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activeClientsCount = useMemo(
    () => clients.filter((c) => c.is_active).length,
    [clients]
  );

  const todayAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments.filter((appt) => new Date(appt.scheduled_at) >= today);
  }, [appointments]);

  const recentAppointments = useMemo(() => appointments.slice(0, 5), [appointments]);
  const recentClients = useMemo(() => clients.slice(0, 5), [clients]);

  const completedCount = useMemo(
    () => appointments.filter((appt) => appt.status === "completed").length,
    [appointments]
  );

  const occupancyRate = useMemo(() => {
    if (appointments.length === 0) return 0;
    return Math.round((completedCount / appointments.length) * 100);
  }, [appointments, completedCount]);

  const monthlyRevenue = useMemo(() => {
    if (appointments.length === 0) return 0;
    return appointments.length * 18000;
  }, [appointments]);

  const openAppointmentPanel = () => {
    setAppointmentForm({
      patient: "",
      scheduledAt: "",
      appointmentType: "Consulta general",
      notes: "",
    });
    setPanel("appointment");
  };

  const openPatientPanel = () => {
    setPatientForm({
      fullName: "",
      email: "",
      phone: "",
    });
    setPanel("patient");
  };

  const closePanel = () => setPanel(null);

  const handleAppointmentChange = (
    field: keyof AppointmentFormState,
    value: string
  ) => {
    setAppointmentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePatientChange = (
    field: keyof PatientFormState,
    value: string
  ) => {
    setPatientForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAppointmentSave = () => {
    console.log("Nueva cita:", appointmentForm);
    closePanel();
  };

  const handlePatientSave = () => {
    console.log("Nuevo paciente:", patientForm);
    closePanel();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg" />
          <p className="text-lg font-semibold text-slate-700">
            Cargando dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30">
        <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
                Resumen general
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Dashboard Vittra Clinic
              </h1>
              <p className="mt-2 max-w-lg text-sm text-slate-500">
                Panel completo con métricas de Pacientes y Citas
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {userData.name} · {getRoleLabel(userData.role)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-36 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
                <CalendarDays className="mr-1.5 h-4 w-4" />
                {new Intl.DateTimeFormat("es-AR", {
                  month: "long",
                  year: "numeric",
                }).format(new Date())}
              </div>

              <button
                onClick={openAppointmentPanel}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/30"
              >
                <Plus className="h-4 w-4" />
                Nueva cita
              </button>

              <button
                onClick={openPatientPanel}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
              >
                <Users className="h-4 w-4" />
                Nuevo Paciente
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Pacientes Activos"
              value={activeClientsCount}
              helper="+12% vs mes anterior"
              tone="emerald"
              icon={<Users className="h-6 w-6" />}
            />
            <MetricCard
              title="Citas Hoy"
              value={todayAppointments.length}
              helper="Agenda del día"
              tone="blue"
              icon={<CalendarDays className="h-6 w-6" />}
            />
            <MetricCard
              title="Ocupación Agenda"
              value={`${occupancyRate}%`}
              helper="Completadas del total"
              tone="violet"
              icon={<Activity className="h-6 w-6" />}
            />
            <MetricCard
              title="Ingresos Mes"
              value={formatCurrency(monthlyRevenue)}
              helper="Estimación operativa"
              tone="orange"
              icon={<Wallet className="h-6 w-6" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard title="Próximas Citas" subtitle="Agenda próxima semana">
              {recentAppointments.length === 0 ? (
                <EmptyState
                  title="Sin citas próximas"
                  description="Las próximas citas aparecerán aquí cuando las agendes."
                />
              ) : (
                <div className="space-y-3 divide-y divide-slate-100">
                  {recentAppointments.map((appt) => {
                    const statusConfig = getStatusConfig(appt.status);

                    return (
                      <div
                        key={appt.id}
                        className="flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                          <CalendarDays className="h-7 w-7 text-slate-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">
                            Cliente #{appt.patient_id}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {appt.appointment_type || "Consulta"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDate(appt.scheduled_at)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatTime(appt.scheduled_at)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex h-7 rounded-full px-2 py-1 text-xs font-semibold ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Pacientes Recientes">
              {recentClients.length === 0 ? (
                <EmptyState
                  title="Sin clientes registrados"
                  description="Comienza registrando clientes para verlos aquí."
                />
              ) : (
                <div className="space-y-3">
                  {recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-slate-100 p-4 transition-all hover:bg-slate-50 hover:shadow-sm"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                        <Users className="h-6 w-6 text-slate-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {client.full_name}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {client.email}
                        </p>
                      </div>

                      <span
                        className={`inline-flex h-6 rounded-full px-2 py-1 text-xs font-semibold ${
                          client.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {client.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Resumen del día" subtitle="Actividad diaria de citas y clientes">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={dailyActivityData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="citations"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Citas"
                    barSize={24}
                  />
                  <Bar
                    dataKey="clients"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Clientes"
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {panel && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePanel}
            />

            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                    {panel === "appointment" ? "Agenda" : "Pacientes"}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    {panel === "appointment" ? "Nueva cita" : "Nuevo paciente"}
                  </h2>
                </div>

                <button
                  onClick={closePanel}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                {panel === "appointment" && (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Paciente
                      </label>
                      <PanelInput
                        placeholder="Ej: María González"
                        value={appointmentForm.patient}
                        onChange={(e) =>
                          handleAppointmentChange("patient", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Fecha y hora
                      </label>
                      <PanelInput
                        type="datetime-local"
                        value={appointmentForm.scheduledAt}
                        onChange={(e) =>
                          handleAppointmentChange("scheduledAt", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tipo de cita
                      </label>
                      <PanelSelect
                        value={appointmentForm.appointmentType}
                        onChange={(e) =>
                          handleAppointmentChange(
                            "appointmentType",
                            e.target.value
                          )
                        }
                      >
                        <option>Consulta general</option>
                        <option>Control</option>
                        <option>Seguimiento</option>
                        <option>Primera vez</option>
                      </PanelSelect>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Notas
                      </label>
                      <PanelTextarea
                        rows={5}
                        placeholder="Motivo de consulta, observaciones, etc."
                        value={appointmentForm.notes}
                        onChange={(e) =>
                          handleAppointmentChange("notes", e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}

                {panel === "patient" && (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre completo
                      </label>
                      <PanelInput
                        placeholder="Ej: Juan Pérez"
                        value={patientForm.fullName}
                        onChange={(e) =>
                          handlePatientChange("fullName", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Email
                      </label>
                      <PanelInput
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={patientForm.email}
                        onChange={(e) =>
                          handlePatientChange("email", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Teléfono
                      </label>
                      <PanelInput
                        placeholder="+54 11 1234 5678"
                        value={patientForm.phone}
                        onChange={(e) =>
                          handlePatientChange("phone", e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 px-6 py-5">
                <div className="flex gap-3">
                  <button
                    onClick={closePanel}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={
                      panel === "appointment"
                        ? handleAppointmentSave
                        : handlePatientSave
                    }
                    className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:shadow-xl hover:shadow-blue-900/30"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}