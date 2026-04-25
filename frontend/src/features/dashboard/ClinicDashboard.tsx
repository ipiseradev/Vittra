import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  ClipboardPlus,
  CreditCard,
  PlayCircle,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { trainityApi } from "../../api/trainityApi";
import {
  EmptyState,
  ErrorAlert,
  LoadingSpinner,
  MetricCard,
  PageHeader,
} from "../../components";
import {
  buildPatientClinicalProfile,
  formatShortDateTime,
  getAppointmentOperationalStatus,
  getOperationalStatusLabel,
  getOperationalStatusTone,
  isToday,
} from "../../lib/clinicalDemo";
import { getRoleLabel, getSessionUser } from "../../lib/session";
import type { Appointment, Doctor, Patient } from "../../types/domain";
import { PatientAssistantPanel } from "./PatientAssistantPanel";

type DashboardState = {
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
};

export function ClinicDashboard() {
  const [state, setState] = useState<DashboardState>({
    patients: [],
    appointments: [],
    doctors: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const user = useMemo(() => getSessionUser(), []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [patients, appointments, doctors] = await Promise.all([
          trainityApi.getPatients().catch(() => []),
          trainityApi.getAppointments().catch(() => []),
          trainityApi.getDoctors({ isActive: true }).catch(() => []),
        ]);

        setState({ patients, appointments, doctors });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  useEffect(() => {
    document.body.style.overflow = assistantOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [assistantOpen]);

  const patientById = useMemo(
    () => new Map(state.patients.map((patient) => [patient.id, patient])),
    [state.patients]
  );
  const doctorById = useMemo(
    () => new Map(state.doctors.map((doctor) => [doctor.id, doctor])),
    [state.doctors]
  );

  const todaysAppointments = useMemo(
    () => state.appointments.filter((appointment) => isToday(appointment.scheduled_at)),
    [state.appointments]
  );

  const operationalCards = useMemo(() => {
    const waitingNow = todaysAppointments.filter(
      (appointment) => getAppointmentOperationalStatus(appointment) === "waiting"
    );
    const delayed = todaysAppointments.filter(
      (appointment) => getAppointmentOperationalStatus(appointment) === "delayed"
    );
    const inConsultation = todaysAppointments.filter(
      (appointment) => getAppointmentOperationalStatus(appointment) === "in_consultation"
    );
    const alerts = state.patients.flatMap((patient) =>
      buildPatientClinicalProfile(patient).alerts.map((alert) => ({
        patient,
        alert,
      }))
    );

    return {
      waitingNow,
      delayed,
      inConsultation,
      alerts,
    };
  }, [todaysAppointments, state.patients]);

  const nextActions = useMemo(
    () => [
      {
        label: "Crear turno",
        description: "Abrir agenda con alta inmediata desde recepcion.",
        href: "/appointments?action=new",
        icon: CalendarClock,
      },
      {
        label: "Nuevo paciente",
        description: "Registrar un paciente sin salir del flujo operativo.",
        href: "/patients?action=new",
        icon: Users,
      },
      {
        label: "Iniciar consulta",
        description: "Entrar directo al encounter del siguiente paciente.",
        href: "/medical-records?action=start-consultation",
        icon: PlayCircle,
      },
    ],
    []
  );

  const workflowSummary = useMemo(() => {
    const completed = state.appointments.filter(
      (appointment) => appointment.status === "completed"
    ).length;
    const billedReady = Math.max(completed - 1, 0);
    const paid = Math.max(completed - 2, 0);

    return [
      { label: "Turnos", value: todaysAppointments.length, helper: "Entrada al flujo" },
      {
        label: "Consultas",
        value: operationalCards.inConsultation.length,
        helper: "Encuentros abiertos ahora",
      },
      { label: "Recetas / ordenes", value: billedReady, helper: "Salida clinica" },
      { label: "Pagos cerrados", value: paid, helper: "Cierre del episodio" },
    ];
  }, [todaysAppointments.length, operationalCards.inConsultation.length, state.appointments]);

  if (loading) {
    return <LoadingSpinner fullscreen label="Cargando mesa operativa..." />;
  }

  return (
    <>
      <div className="page-shell">
        <PageHeader
          eyebrow="Mesa operativa"
          title="Dashboard clinico en tiempo real"
          description="Vittra pasa de dashboard decorativo a consola accionable: sala de espera, demoras, consultas en curso, alertas y atajos para mover la clinica."
          meta={
            <div className="flex flex-wrap items-center gap-3">
              <span className="pill bg-sky-100 text-sky-800">
                {user.name} · {getRoleLabel(user.role)}
              </span>
              <span className="pill bg-slate-100 text-slate-700">
                {new Intl.DateTimeFormat("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(new Date())}
              </span>
            </div>
          }
          actions={
            <>
              {nextActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={action.label === "Iniciar consulta" ? "btn-primary" : "btn-secondary"}
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setAssistantOpen(true)}
                className="btn-secondary"
              >
                <Bot className="h-4 w-4" />
                Copiloto IA
              </button>
            </>
          }
        />

        {error ? <ErrorAlert message={error} /> : null}

        <section className="dashboard-grid">
          <MetricCard
            label="Pacientes esperando ahora"
            value={operationalCards.waitingNow.length}
            helper="Listos para pasar del front desk a la consulta"
            icon={Users}
            tone="amber"
          />
          <MetricCard
            label="Turnos con retraso"
            value={operationalCards.delayed.length}
            helper="Bloqueos operativos a resolver antes de que escalen"
            icon={AlertTriangle}
            tone="rose"
          />
          <MetricCard
            label="Consultas en curso"
            value={operationalCards.inConsultation.length}
            helper="Profesionales ya trabajando dentro del flujo"
            icon={PlayCircle}
            tone="teal"
          />
          <MetricCard
            label="Alertas clinicas"
            value={operationalCards.alerts.length}
            helper="Alergias, riesgos y seguimientos visibles hoy"
            icon={ClipboardPlus}
            tone="sky"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="surface-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title">Operacion del momento</h2>
                <p className="section-copy">
                  Una sola vista para recepcion, coordinacion y direccion medica.
                </p>
              </div>
              <Link to="/appointments" className="btn-ghost">
                Abrir agenda
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <article className="surface-muted p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Sala de espera
                </h3>
                <div className="mt-4 space-y-3">
                  {operationalCards.waitingNow.length > 0 ? (
                    operationalCards.waitingNow.slice(0, 4).map((appointment) => {
                      const patient = patientById.get(appointment.patient_id);
                      const doctor = doctorById.get(appointment.doctor_id);

                      return (
                        <div
                          key={appointment.id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {patient?.full_name ?? `Paciente #${appointment.patient_id}`}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {doctor ? `Dr. ${doctor.full_name}` : "Profesional por asignar"}
                              </p>
                              <p className="mt-2 text-sm text-slate-500">
                                {formatShortDateTime(appointment.scheduled_at)}
                              </p>
                            </div>
                            <span
                              className={`pill ${getOperationalStatusTone(
                                getAppointmentOperationalStatus(appointment)
                              )}`}
                            >
                              {getOperationalStatusLabel(
                                getAppointmentOperationalStatus(appointment)
                              )}
                            </span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              to={`/medical-records?appointmentId=${appointment.id}&patientId=${appointment.patient_id}&action=start`}
                              className="btn-primary"
                            >
                              Iniciar consulta
                            </Link>
                            <Link to="/appointments" className="btn-secondary">
                              Check-in / agenda
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="No hay pacientes esperando"
                      description="Si la recepcion todavia no hizo check-in, usa la agenda para activar la cola de la jornada."
                      action={{
                        label: "Ir a agenda",
                        onClick: () => {
                          window.location.href = "/appointments";
                        },
                      }}
                    />
                  )}
                </div>
              </article>

              <article className="surface-muted p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Alertas y riesgos
                </h3>
                <div className="mt-4 space-y-3">
                  {operationalCards.alerts.slice(0, 4).map(({ patient, alert }) => (
                    <div
                      key={`${patient.id}-${alert.title}`}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{patient.full_name}</p>
                        <span
                          className={`pill ${
                            alert.severity === "critical"
                              ? "bg-rose-50 text-rose-700"
                              : alert.severity === "high"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-700">{alert.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{alert.context}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>

          <div className="space-y-6">
            <section className="surface-card p-6 sm:p-7">
              <h2 className="section-title">Flujo clinico conectado</h2>
              <p className="section-copy">
                El producto empieza a contar un recorrido real: turno, consulta, salida clinica y cobro.
              </p>
              <div className="mt-6 space-y-3">
                {workflowSummary.map((step) => (
                  <div
                    key={step.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{step.label}</p>
                      <span className="text-xl font-bold text-slate-950">{step.value}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{step.helper}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card p-6 sm:p-7">
              <h2 className="section-title">Acciones inmediatas</h2>
              <p className="section-copy">
                Microcopy orientado a accion, no a vacio pasivo.
              </p>
              <div className="mt-6 space-y-3">
                {nextActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.href}
                      className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/50"
                    >
                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{action.label}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </section>

        <section className="surface-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="section-title">Consultas en curso y turnos con retraso</h2>
              <p className="section-copy">
                El dashboard no solo informa: ayuda a priorizar lo que hay que destrabar ahora.
              </p>
            </div>
            <Link to="/billing" className="btn-secondary">
              <CreditCard className="h-4 w-4" />
              Ver cierre financiero
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="surface-muted p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                En consulta
              </h3>
              <div className="mt-4 space-y-3">
                {operationalCards.inConsultation.length > 0 ? (
                  operationalCards.inConsultation.slice(0, 4).map((appointment) => {
                    const patient = patientById.get(appointment.patient_id);
                    return (
                      <Link
                        key={appointment.id}
                        to={`/medical-records?appointmentId=${appointment.id}&patientId=${appointment.patient_id}&action=summary`}
                        className="block rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/50"
                      >
                        <p className="font-semibold text-slate-900">
                          {patient?.full_name ?? `Paciente #${appointment.patient_id}`}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {formatShortDateTime(appointment.scheduled_at)}
                        </p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">
                    Todavia no hay consultas marcadas en curso hoy.
                  </p>
                )}
              </div>
            </article>

            <article className="surface-muted p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Retrasos
              </h3>
              <div className="mt-4 space-y-3">
                {operationalCards.delayed.length > 0 ? (
                  operationalCards.delayed.slice(0, 4).map((appointment) => {
                    const patient = patientById.get(appointment.patient_id);
                    return (
                      <div
                        key={appointment.id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                      >
                        <p className="font-semibold text-slate-900">
                          {patient?.full_name ?? `Paciente #${appointment.patient_id}`}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Requiere reordenar agenda o iniciar consulta.
                        </p>
                        <Link
                          to={`/appointments`}
                          className="btn-secondary mt-4"
                        >
                          Resolver en agenda
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">
                    Sin retrasos operativos para destacar ahora.
                  </p>
                )}
              </div>
            </article>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {assistantOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssistantOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="relative h-[82vh] w-full max-w-6xl overflow-hidden rounded-[30px] border border-slate-200 bg-[#202123] shadow-[0_40px_120px_-40px_rgba(15,23,42,0.6)]"
              >
                <button
                  type="button"
                  onClick={() => setAssistantOpen(false)}
                  className="absolute right-5 top-5 z-20 rounded-2xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
                <PatientAssistantPanel mode="modal" />
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
