import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  Edit2,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import {
  EmptyState,
  ErrorAlert,
  LoadingSpinner,
  MetricCard,
  PageHeader,
  SuccessAlert,
} from "../../components";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  formatShortDateTime,
  getAppointmentOperationalStatus,
  getOperationalStatusLabel,
  getOperationalStatusTone,
  isToday,
  type OperationalAppointmentStatus,
} from "../../lib/clinicalDemo";
import type {
  Appointment,
  CreateAppointmentPayload,
  Doctor,
  Patient,
  UpdateAppointmentPayload,
} from "../../types/domain";

type AppointmentData = {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
};

const appointmentTypeOptions: {
  value: Appointment["appointment_type"];
  label: string;
}[] = [
  { value: "consultation", label: "Consulta" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "procedure", label: "Procedimiento" },
  { value: "checkup", label: "Control" },
];

const persistedStatusOptions: { value: Appointment["status"]; label: string }[] = [
  { value: "scheduled", label: "Programada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "no_show", label: "No asistio" },
  { value: "rescheduled", label: "Reagendada" },
];

const initialFormState: CreateAppointmentPayload = {
  patient_id: 0,
  doctor_id: 0,
  appointment_type: "consultation",
  scheduled_at: "",
  duration_minutes: 30,
  notes: "",
  room: "",
};

export function AppointmentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<AppointmentData>({
    appointments: [],
    patients: [],
    doctors: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OperationalAppointmentStatus | "all">(
    "all"
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateAppointmentPayload>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [checkedInIds, setCheckedInIds] = useState<number[]>([]);

  const debouncedSearch = useDebouncedValue(searchTerm, 200);

  useEffect(() => {
    async function loadAppointments() {
      try {
        setLoading(true);
        setError(null);
        const [appointments, patients, doctors] = await Promise.all([
          trainityApi.getAppointments(),
          trainityApi.getPatients({ isActive: true }),
          trainityApi.getDoctors({ isActive: true }),
        ]);
        setData({ appointments, patients, doctors });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la agenda.");
      } finally {
        setLoading(false);
      }
    }

    void loadAppointments();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new") {
      resetForm();
      setDrawerOpen(true);
    }
  }, [location.search]);

  const patientById = useMemo(
    () => new Map(data.patients.map((patient) => [patient.id, patient])),
    [data.patients]
  );
  const doctorById = useMemo(
    () => new Map(data.doctors.map((doctor) => [doctor.id, doctor])),
    [data.doctors]
  );

  function getDisplayStatus(appointment: Appointment): OperationalAppointmentStatus {
    if (
      checkedInIds.includes(appointment.id) &&
      appointment.status === "scheduled"
    ) {
      return "waiting";
    }

    return getAppointmentOperationalStatus(appointment);
  }

  const filteredAppointments = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    return data.appointments
      .filter((appointment) => {
        const patient = patientById.get(appointment.patient_id);
        const doctor = doctorById.get(appointment.doctor_id);
        const operationalStatus = getDisplayStatus(appointment);
        const matchesStatus =
          statusFilter === "all" || operationalStatus === statusFilter;
        const matchesSearch =
          !query ||
          patient?.full_name.toLowerCase().includes(query) ||
          doctor?.full_name.toLowerCase().includes(query) ||
          appointment.room?.toLowerCase().includes(query);

        return matchesStatus && matchesSearch;
      })
      .sort(
        (left, right) =>
          new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime()
      );
  }, [data.appointments, debouncedSearch, statusFilter, patientById, doctorById, checkedInIds]);

  const todaysAppointments = useMemo(
    () => data.appointments.filter((appointment) => isToday(appointment.scheduled_at)),
    [data.appointments]
  );

  const stats = useMemo(() => {
    const inWaitingRoom = todaysAppointments.filter(
      (appointment) => getDisplayStatus(appointment) === "waiting"
    ).length;
    const delayed = todaysAppointments.filter(
      (appointment) => getDisplayStatus(appointment) === "delayed"
    ).length;
    const inConsultation = todaysAppointments.filter(
      (appointment) => getDisplayStatus(appointment) === "in_consultation"
    ).length;
    const absent = data.appointments.filter(
      (appointment) => appointment.status === "no_show"
    ).length;

    return {
      total: todaysAppointments.length,
      inWaitingRoom,
      delayed,
      inConsultation,
      absent,
    };
  }, [todaysAppointments, data.appointments, checkedInIds]);

  const loadByDoctor = useMemo(
    () =>
      data.doctors
        .map((doctor) => ({
          doctorId: doctor.id,
          doctorName: doctor.full_name,
          total: todaysAppointments.filter((appointment) => appointment.doctor_id === doctor.id)
            .length,
          waiting: todaysAppointments.filter(
            (appointment) =>
              appointment.doctor_id === doctor.id &&
              getDisplayStatus(appointment) === "waiting"
          ).length,
        }))
        .filter((item) => item.total > 0),
    [data.doctors, todaysAppointments, checkedInIds]
  );

  const loadByRoom = useMemo(() => {
    const roomMap = new Map<string, number>();

    todaysAppointments.forEach((appointment) => {
      const room = appointment.room || "Sin consultorio";
      roomMap.set(room, (roomMap.get(room) ?? 0) + 1);
    });

    return Array.from(roomMap.entries()).map(([room, total]) => ({ room, total }));
  }, [todaysAppointments]);

  function resetForm() {
    setForm(initialFormState);
    setEditingAppointmentId(null);
  }

  function openCreateDrawer() {
    resetForm();
    setDrawerOpen(true);
  }

  function openEditDrawer(appointment: Appointment) {
    setEditingAppointmentId(appointment.id);
    setForm({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      appointment_type: appointment.appointment_type,
      scheduled_at: appointment.scheduled_at.slice(0, 16),
      duration_minutes: appointment.duration_minutes,
      room: appointment.room ?? "",
      notes: appointment.notes ?? "",
    });
    setDrawerOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      if (editingAppointmentId) {
        const updated = await trainityApi.updateAppointment(editingAppointmentId, form);
        setData((current) => ({
          ...current,
          appointments: current.appointments.map((appointment) =>
            appointment.id === editingAppointmentId ? updated : appointment
          ),
        }));
        setFeedback("Turno actualizado correctamente.");
      } else {
        const created = await trainityApi.createAppointment(form);
        setData((current) => ({
          ...current,
          appointments: [created, ...current.appointments],
        }));
        setFeedback("Turno creado correctamente.");
      }

      setDrawerOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el turno.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(appointmentId: number, status: Appointment["status"]) {
    try {
      const payload: UpdateAppointmentPayload = { status };
      const updated = await trainityApi.updateAppointment(appointmentId, payload);
      setData((current) => ({
        ...current,
        appointments: current.appointments.map((appointment) =>
          appointment.id === appointmentId ? updated : appointment
        ),
      }));
      setFeedback("Estado del turno actualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    }
  }

  function markCheckIn(appointmentId: number) {
    setCheckedInIds((current) =>
      current.includes(appointmentId) ? current : [...current, appointmentId]
    );
    setFeedback("Paciente marcado en espera para la consulta.");
  }

  function exportCsv() {
    const rows = [
      ["Paciente", "Profesional", "Fecha", "Estado operativo", "Consultorio"],
      ...filteredAppointments.map((appointment) => [
        patientById.get(appointment.patient_id)?.full_name ?? "Sin asignar",
        doctorById.get(appointment.doctor_id)?.full_name ?? "Sin asignar",
        formatShortDateTime(appointment.scheduled_at),
        getOperationalStatusLabel(getDisplayStatus(appointment)),
        appointment.room || "-",
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `vittra-agenda-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setFeedback("Agenda exportada en CSV.");
  }

  if (loading) {
    return <LoadingSpinner fullscreen label="Cargando agenda operativa..." />;
  }

  return (
    <>
      <div className="page-shell">
        <PageHeader
          eyebrow="Agenda clinica"
          title="Centro operativo de turnos"
          description="La agenda ya no es solo un listado. Orquesta confirmacion, espera, consulta, reprogramacion y el salto directo a historia clinica."
          actions={
            <>
              <button type="button" onClick={openCreateDrawer} className="btn-primary">
                <Plus className="h-4 w-4" />
                Crear turno
              </button>
              <button type="button" onClick={exportCsv} className="btn-secondary">
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </>
          }
        />

        {error ? <ErrorAlert message={error} onDismiss={() => setError(null)} /> : null}
        {feedback ? <SuccessAlert message={feedback} /> : null}

        <section className="dashboard-grid">
          <MetricCard
            label="Turnos de hoy"
            value={stats.total}
            helper="Carga operativa de la jornada"
            icon={CalendarClock}
            tone="sky"
          />
          <MetricCard
            label="Pacientes esperando"
            value={stats.inWaitingRoom}
            helper="Listos para pasar a consulta"
            icon={UserCheck}
            tone="amber"
          />
          <MetricCard
            label="Consultas activas"
            value={stats.inConsultation}
            helper="Encuentros en curso"
            icon={Stethoscope}
            tone="teal"
          />
          <MetricCard
            label="Ausentes / retrasos"
            value={`${stats.absent} / ${stats.delayed}`}
            helper="Impacto real sobre la operacion"
            icon={Clock3}
            tone="rose"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title">Vista del dia</h2>
                <p className="section-copy">
                  La recepcion puede ver en segundos donde esta el cuello de botella.
                </p>
              </div>
              <span className="pill bg-slate-100 text-slate-700">
                {todaysAppointments.length} turnos activos
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="surface-muted p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Por profesional
                </h3>
                <div className="mt-4 space-y-3">
                  {loadByDoctor.length > 0 ? (
                    loadByDoctor.map((item) => (
                      <div
                        key={item.doctorId}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{item.doctorName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.waiting} esperando · {item.total} turnos hoy
                          </p>
                        </div>
                        <span className="pill bg-sky-50 text-sky-700">{item.total}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No hay carga asignada hoy.</p>
                  )}
                </div>
              </article>

              <article className="surface-muted p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Por consultorio
                </h3>
                <div className="mt-4 space-y-3">
                  {loadByRoom.length > 0 ? (
                    loadByRoom.map((item) => (
                      <div
                        key={item.room}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{item.room}</p>
                          <p className="mt-1 text-sm text-slate-500">Uso actual del recurso</p>
                        </div>
                        <span className="pill bg-teal-50 text-teal-700">{item.total}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Aun no hay consultorios asignados.</p>
                  )}
                </div>
              </article>
            </div>
          </div>

          <div className="surface-card p-6 sm:p-7">
            <h2 className="section-title">Flujo conectado</h2>
            <p className="section-copy">
              Cada turno listo para saltar directo a consulta, receta y cierre financiero.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Turno confirmado -> Check-in rapido -> Iniciar consulta",
                "Consulta abierta -> Evolucion estructurada -> Receta / orden",
                "Receta emitida -> Cargo generado -> Pago del episodio",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
            <Link to="/medical-records?action=start-consultation" className="btn-primary mt-6">
              <Stethoscope className="h-4 w-4" />
              Iniciar proxima consulta
            </Link>
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.7fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por paciente, profesional o consultorio"
                className="input-field pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "Todos"],
                ["waiting", "En espera"],
                ["in_consultation", "En consulta"],
                ["delayed", "Con retraso"],
                ["completed", "Finalizados"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={statusFilter === value ? "btn-primary" : "btn-secondary"}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end">
              <span className="pill bg-slate-100 text-slate-700">
                {filteredAppointments.length} visibles
              </span>
            </div>
          </div>
        </section>

        {filteredAppointments.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No hay turnos para mostrar"
            description="No dejes la agenda vacia: crea un turno o ajusta los filtros para ver la operacion."
            action={{ label: "Crear turno", onClick: openCreateDrawer }}
          />
        ) : (
          <section className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const patient = patientById.get(appointment.patient_id);
              const doctor = doctorById.get(appointment.doctor_id);
              const operationalStatus = getDisplayStatus(appointment);
              const typeLabel =
                appointmentTypeOptions.find(
                  (type) => type.value === appointment.appointment_type
                )?.label ?? appointment.appointment_type;
              const persistedStatusLabel =
                persistedStatusOptions.find((status) => status.value === appointment.status)
                  ?.label ?? appointment.status;

              return (
                <article
                  key={appointment.id}
                  className="surface-card flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {patient?.full_name ?? `Paciente #${appointment.patient_id}`}
                      </h3>
                      <span className={`pill ${getOperationalStatusTone(operationalStatus)}`}>
                        {getOperationalStatusLabel(operationalStatus)}
                      </span>
                      <span className="pill bg-slate-100 text-slate-700">{typeLabel}</span>
                      <span className="pill bg-white text-slate-500 ring-1 ring-slate-200">
                        Estado base: {persistedStatusLabel}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {doctor ? `Dr. ${doctor.full_name}` : "Profesional sin asignar"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5">
                        {formatShortDateTime(appointment.scheduled_at)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5">
                        {appointment.duration_minutes} min
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5">
                        {appointment.room || "Consultorio por asignar"}
                      </span>
                    </div>
                    {appointment.notes ? (
                      <p className="mt-4 text-sm leading-6 text-slate-600">{appointment.notes}</p>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        Sin notas de triage. La recepcion puede agregar motivo, cobertura y observaciones previas.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {appointment.status === "scheduled" ? (
                      <button
                        type="button"
                        onClick={() => markCheckIn(appointment.id)}
                        className="btn-secondary"
                      >
                        <UserCheck className="h-4 w-4" />
                        Check-in rapido
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/medical-records?appointmentId=${appointment.id}&patientId=${appointment.patient_id}&action=start`
                        )
                      }
                      className="btn-primary"
                    >
                      <Stethoscope className="h-4 w-4" />
                      Iniciar consulta
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditDrawer(appointment)}
                      className="btn-secondary"
                    >
                      <Edit2 className="h-4 w-4" />
                      Reprogramar
                    </button>

                    {appointment.status !== "completed" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(appointment.id, "completed")}
                        className="btn-secondary"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Cerrar turno
                      </button>
                    ) : null}

                    {appointment.status !== "cancelled" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(appointment.id, "cancelled")}
                        className="btn-secondary text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-[0_30px_90px_-24px_rgba(15,23,42,0.45)] transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="page-kicker text-[11px] tracking-[0.2em]">Agenda conectada</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {editingAppointmentId ? "Editar turno" : "Nuevo turno"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="btn-secondary h-11 w-11 px-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div>
              <label className="field-label" htmlFor="appointment_patient">
                Paciente
              </label>
              <select
                id="appointment_patient"
                className="select-field"
                value={form.patient_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    patient_id: Number(event.target.value),
                  }))
                }
                required
              >
                <option value={0}>Seleccionar paciente</option>
                {data.patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="appointment_doctor">
                Profesional
              </label>
              <select
                id="appointment_doctor"
                className="select-field"
                value={form.doctor_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    doctor_id: Number(event.target.value),
                  }))
                }
                required
              >
                <option value={0}>Seleccionar profesional</option>
                {data.doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="appointment_type">
                  Tipo de turno
                </label>
                <select
                  id="appointment_type"
                  className="select-field"
                  value={form.appointment_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      appointment_type: event.target.value as Appointment["appointment_type"],
                    }))
                  }
                >
                  {appointmentTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="appointment_duration">
                  Duracion
                </label>
                <input
                  id="appointment_duration"
                  type="number"
                  min={15}
                  step={15}
                  className="input-field"
                  value={form.duration_minutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      duration_minutes: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="appointment_date">
                Fecha y hora
              </label>
              <input
                id="appointment_date"
                type="datetime-local"
                className="input-field"
                value={form.scheduled_at}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scheduled_at: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="appointment_room">
                Consultorio
              </label>
              <input
                id="appointment_room"
                className="input-field"
                value={form.room}
                onChange={(event) =>
                  setForm((current) => ({ ...current, room: event.target.value }))
                }
                placeholder="Ej. Sala 2"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="appointment_notes">
                Nota operativa
              </label>
              <textarea
                id="appointment_notes"
                className="textarea-field"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Motivo de consulta, observaciones o preparacion previa"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 px-6 py-5">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting
                  ? "Guardando..."
                  : editingAppointmentId
                    ? "Actualizar turno"
                    : "Crear turno"}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </>
  );
}
