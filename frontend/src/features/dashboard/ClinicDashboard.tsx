import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Search,
  Users,
  Briefcase,
  DollarSign,
  Heart,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronDown,
  Download,
  CalendarDays,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { trainityApi } from "../../api/trainityApi";
import type { Patient, Doctor, Appointment } from "../../types/domain";

const PATIENT_EVOLUTION_DATA = [
  { mes: "Ene", recuperados: 120, pendientes: 20 },
  { mes: "Feb", recuperados: 150, pendientes: 25 },
  { mes: "Mar", recuperados: 180, pendientes: 22 },
  { mes: "Abr", recuperados: 200, pendientes: 18 },
  { mes: "May", recuperados: 220, pendientes: 20 },
  { mes: "Jun", recuperados: 250, pendientes: 25 },
  { mes: "Jul", recuperados: 280, pendientes: 23 },
  { mes: "Ago", recuperados: 300, pendientes: 20 },
  { mes: "Sep", recuperados: 320, pendientes: 22 },
  { mes: "Oct", recuperados: 350, pendientes: 24 },
  { mes: "Nov", recuperados: 380, pendientes: 26 },
  { mes: "Dic", recuperados: 400, pendientes: 28 },
];

const SOLICITUDES_CITAS_DATA = [
  { id: 1, paciente: "María López García", fecha: "2026-04-15", hora: "09:30", medico: "Dr. James Smith", estado: "pendiente" },
  { id: 2, paciente: "Carlos Rodríguez Pérez", fecha: "2026-04-16", hora: "10:00", medico: "Dra. Emily Johnson", estado: "confirmada" },
  { id: 3, paciente: "Ana Martínez Silva", fecha: "2026-04-17", hora: "14:30", medico: "Dr. Michael Chen", estado: "pendiente" },
  { id: 4, paciente: "Juan Fernández López", fecha: "2026-04-18", hora: "11:00", medico: "Dr. James Smith", estado: "rechazada" },
  { id: 5, paciente: "Teresa González Ruiz", fecha: "2026-04-19", hora: "15:00", medico: "Dra. Sarah Davis", estado: "confirmada" },
];

const PACIENTES_RECIENTES_DATA = [
  { id: 1, nombre: "Olivia Shanley", genero: "Femenino", peso: "62", enfermedad: "Cáncer", estado: "Recuperado", dias: "29" },
  { id: 2, nombre: "Johannes Blake", genero: "Masculino", peso: "78", enfermedad: "Diabetes", estado: "En Tratamiento", dias: "15" },
  { id: 3, nombre: "Evelyn Thomas", genero: "Femenino", peso: "55", enfermedad: "Stroke", estado: "Recuperado", dias: "32" },
  { id: 4, nombre: "Mauricio Mack", genero: "Masculino", peso: "82", enfermedad: "Stroke", estado: "Recuperado", dias: "8" },
  { id: 5, nombre: "Sarah Wilson", genero: "Femenino", peso: "68", enfermedad: "Hipertensión", estado: "En Tratamiento", dias: "12" },
];

type MetricCardProps = {
  title: string;
  value: string | number;
  helper: string;
  icon: React.ElementType;
  iconWrapClass: string;
  iconClass: string;
};

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  iconWrapClass,
  iconClass,
}: MetricCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-2xl p-3 shadow-sm ${iconWrapClass}`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>{helper}</span>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function ClinicDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [userData] = useState({
    name: "Dr. John Smith",
    role: "Administrador de la Clínica",
    initials: "JS",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pts, docs, apts] = await Promise.all([
          trainityApi.getPatients({ isActive: true }).catch(() => []),
          trainityApi.getDoctors({ isActive: true }).catch(() => []),
          trainityApi.getAppointments().catch(() => []),
        ]);

        setPatients(pts || []);
        setDoctors(docs || []);
        setAppointments(apts || []);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const topDoctor = doctors[0] || {
    id: 1,
    full_name: "Dr. James Smith",
    phone: "+1 (555) 123-4567",
    email: "james@clinic.com",
    role: "Cardiólogo",
    is_active: true,
  };

  const metrics = useMemo(() => {
    const ingresosTotales = 5728.5;
    const pacientesActivos = patients.length || 45;
    const medicosActivos = doctors.length || 32;
    const citasHoy = appointments.length || 12;

    return {
      pacientesActivos,
      medicosActivos,
      citasHoy,
      ingresosTotales,
    };
  }, [patients, doctors, appointments]);

  const resumenSuperior = useMemo(() => {
    const totalRecuperados = PATIENT_EVOLUTION_DATA.reduce(
      (acc, item) => acc + item.recuperados,
      0
    );
    const totalPendientes = PATIENT_EVOLUTION_DATA.reduce(
      (acc, item) => acc + item.pendientes,
      0
    );

    return {
      totalRecuperados,
      totalPendientes,
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="font-medium text-slate-600">Cargando SaludAR...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-20 items-center justify-between px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-4">
            <div className="hidden sm:flex sm:items-center sm:gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md">
                SA
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">SaludAR</p>
                <p className="text-xs text-slate-500">Panel clínico inteligente</p>
              </div>
            </div>

            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pacientes, médicos, citas o diagnósticos..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="ml-6 flex items-center gap-3 sm:gap-5">
            <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:bg-slate-50">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                {userData.initials}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-slate-900">{userData.name}</p>
                <p className="text-xs text-slate-500">{userData.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Resumen general
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Dashboard clínico
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Controlá pacientes, médicos, ingresos y solicitudes desde un panel
              central con visión operativa en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <CalendarDays className="h-4 w-4" />
              Abril 2026
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              <Activity className="h-4 w-4" />
              Ver actividad
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Pacientes activos"
            value={metrics.pacientesActivos}
            helper="+12% este mes"
            icon={Users}
            iconWrapClass="bg-blue-50"
            iconClass="text-blue-600"
          />

          <MetricCard
            title="Médicos disponibles"
            value={metrics.medicosActivos}
            helper="Plantilla activa"
            icon={Heart}
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
          />

          <MetricCard
            title="Citas registradas"
            value={metrics.citasHoy}
            helper="+5% vs. mes anterior"
            icon={Briefcase}
            iconWrapClass="bg-violet-50"
            iconClass="text-violet-600"
          />

          <MetricCard
            title="Ingresos totales"
            value={`$${metrics.ingresosTotales.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            helper="+8.5% este año"
            icon={DollarSign}
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <SectionCard
              title="Evolución de pacientes"
              subtitle={`Recuperados: ${resumenSuperior.totalRecuperados} · Pendientes: ${resumenSuperior.totalPendientes}`}
              action={
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm">
                  <button className="rounded-lg bg-white px-3 py-1.5 font-semibold text-slate-900 shadow-sm">
                    Este año
                  </button>
                </div>
              }
            >
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-700">Pacientes recuperados</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-900">
                    {resumenSuperior.totalRecuperados}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-700">Casos pendientes</p>
                  <p className="mt-2 text-2xl font-bold text-blue-900">
                    {resumenSuperior.totalPendientes}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-600">Tendencia anual</p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
                    +32%
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={PATIENT_EVOLUTION_DATA} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    axisLine={false}
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 12 }} />
                  <Bar
                    dataKey="recuperados"
                    fill="#10b981"
                    radius={[10, 10, 0, 0]}
                    name="Recuperados"
                  />
                  <Bar
                    dataKey="pendientes"
                    fill="#60a5fa"
                    radius={[10, 10, 0, 0]}
                    name="Pendientes"
                  />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard
              title="Solicitudes de citas"
              subtitle="Aprobá o rechazá rápidamente las próximas solicitudes."
              action={
                <button className="text-sm font-semibold text-blue-600 transition hover:text-blue-700">
                  Ver todas
                </button>
              }
            >
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Paciente
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Hora
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Médico
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {SOLICITUDES_CITAS_DATA.slice(0, 5).map((item) => {
                      const estadoClass =
                        item.estado === "confirmada"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.estado === "rechazada"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700";

                      return (
                        <tr key={item.id} className="transition hover:bg-slate-50/80">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{item.paciente}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {new Date(item.fecha).toLocaleDateString("es-AR")}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">{item.hora}</td>
                          <td className="px-4 py-4 text-sm text-slate-600">{item.medico}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${estadoClass}`}
                            >
                              {item.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                title="Aceptar"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Aceptar
                              </button>

                              <button
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                title="Rechazar"
                              >
                                <XCircle className="h-4 w-4" />
                                Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6 xl:col-span-4">
            <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-900/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-blue-100">Destacado del equipo</h3>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90">
                  Top médico
                </span>
              </div>

              <div className="mt-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold shadow-lg backdrop-blur">
                  {topDoctor.full_name.charAt(0)}
                </div>
                <h4 className="mt-4 text-2xl font-bold">{topDoctor.full_name}</h4>
                <p className="mt-1 text-sm text-blue-100">{topDoctor.role}</p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-xl font-bold">8</p>
                  <p className="mt-1 text-xs text-blue-100">Años</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">2,598</p>
                  <p className="mt-1 text-xs text-blue-100">Pacientes</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">4.8★</p>
                  <p className="mt-1 text-xs text-blue-100">Rating</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50">
                  Agendar cita
                </button>
                <button className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                  Ver perfil profesional
                </button>
              </div>
            </section>

            <SectionCard
              title="Pacientes recientes"
              subtitle="Últimos ingresos y estado actual."
              action={
                <button
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                  title="Exportar"
                >
                  <Download className="h-4 w-4" />
                </button>
              }
            >
              <div className="space-y-3">
                {PACIENTES_RECIENTES_DATA.map((paciente) => {
                  const estadoClass =
                    paciente.estado === "Recuperado"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700";

                  return (
                    <div
                      key={paciente.id}
                      className="rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {paciente.nombre}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {paciente.genero} · {paciente.peso} kg
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${estadoClass}`}
                        >
                          {paciente.estado}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span>{paciente.enfermedad}</span>
                        <span>{paciente.dias} días</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}