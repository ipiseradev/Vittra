import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  FilePlus2,
  Pill,
  ShieldAlert,
  Stethoscope,
  Wallet,
} from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import { EmptyState, ErrorAlert, LoadingSpinner, MetricCard, PageHeader } from "../../components";
import {
  buildPatientClinicalProfile,
  formatCurrency,
  formatShortDateTime,
  getAgeLabel,
  getPatientDisplayDocument,
} from "../../lib/clinicalDemo";
import type { Appointment, Doctor, Patient } from "../../types/domain";

type MedicalRecordsState = {
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
};

function buildEncounterNote(patient: Patient) {
  const seed = patient.id % 4;

  return {
    subjective:
      seed % 2 === 0
        ? "Paciente refiere buena adherencia parcial al plan. Persisten sintomas leves y consulta por ajuste de medicacion."
        : "Consulta por control programado. Refiere episodios intermitentes y solicita renovacion de tratamiento cronico.",
    objective:
      seed % 2 === 0
        ? "TA 128/82, FC 76, saturacion 98%, sin signos de alarma al examen general."
        : "TA 136/88, FC 82, glucemia capilar a revisar con laboratorio reciente.",
    assessment:
      seed % 2 === 0
        ? "Paciente estable, con necesidad de reforzar seguimiento y completar estudio pendiente."
        : "Caso cronico controlable, con riesgo moderado por seguimiento incompleto y potencial interaccion terapeutica.",
    plan: [
      "Registrar evolucion estructurada y diagnosticos CIE-10.",
      "Emitir receta renovada con vigencia de 30 dias.",
      "Solicitar control de laboratorio antes del proximo turno.",
      "Coordinar cierre administrativo y proximo seguimiento.",
    ],
  };
}

export function MedicalRecordsPage() {
  const location = useLocation();
  const [state, setState] = useState<MedicalRecordsState>({
    patients: [],
    appointments: [],
    doctors: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
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
        setError(
          err instanceof Error ? err.message : "No se pudo cargar la historia clinica."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const queryPatientId = Number(params.get("patientId") ?? 0);
    const focus = params.get("focus");

    if (queryPatientId > 0) {
      setSelectedPatientId(queryPatientId);
      return;
    }

    if (focus === "diabetes") {
      const diabetesPatient = state.patients.find((patient) =>
        buildPatientClinicalProfile(patient).diagnoses.some((item) => item.code === "E11.9")
      );

      if (diabetesPatient) {
        setSelectedPatientId(diabetesPatient.id);
        return;
      }
    }

    if (!selectedPatientId && state.patients[0]) {
      setSelectedPatientId(state.patients[0].id);
    }
  }, [params, state.patients, selectedPatientId]);

  const selectedPatient = useMemo(
    () => state.patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [state.patients, selectedPatientId]
  );

  const selectedProfile = useMemo(
    () => (selectedPatient ? buildPatientClinicalProfile(selectedPatient) : null),
    [selectedPatient]
  );

  const patientAppointments = useMemo(() => {
    if (!selectedPatientId) return [];

    return state.appointments
      .filter((appointment) => appointment.patient_id === selectedPatientId)
      .sort(
        (left, right) =>
          new Date(right.scheduled_at).getTime() - new Date(left.scheduled_at).getTime()
      );
  }, [state.appointments, selectedPatientId]);

  const currentAppointment = useMemo(() => {
    const queryAppointmentId = Number(params.get("appointmentId") ?? 0);

    if (queryAppointmentId > 0) {
      return (
        patientAppointments.find((appointment) => appointment.id === queryAppointmentId) ?? null
      );
    }

    return patientAppointments[0] ?? null;
  }, [params, patientAppointments]);

  const attendingDoctor = useMemo(
    () =>
      state.doctors.find((doctor) => doctor.id === currentAppointment?.doctor_id) ?? null,
    [state.doctors, currentAppointment]
  );

  const encounterNote = useMemo(
    () => (selectedPatient ? buildEncounterNote(selectedPatient) : null),
    [selectedPatient]
  );

  const aiSummaryVisible = params.get("action") === "summary" || params.get("action") === "start";

  if (loading) {
    return <LoadingSpinner fullscreen label="Cargando patient 360..." />;
  }

  if (!selectedPatient || !selectedProfile || !encounterNote) {
    return (
      <div className="page-shell">
        <EmptyState
          icon={ClipboardList}
          title="No hay historia clinica disponible"
          description="Carga pacientes y turnos para empezar a usar el workspace clinico."
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Atencion clinica"
        title="Patient 360 y workspace de consulta"
        description="Lectura rapida de la historia clinica, evolucion estructurada, riesgos visibles y salida directa a receta y facturacion."
        actions={
          <>
            <Link
              to={`/prescriptions?patientId=${selectedPatient.id}&appointmentId=${currentAppointment?.id ?? ""}&action=new`}
              className="btn-primary"
            >
              <Pill className="h-4 w-4" />
              Crear receta
            </Link>
            <Link
              to={`/billing?patientId=${selectedPatient.id}&appointmentId=${currentAppointment?.id ?? ""}&action=collect`}
              className="btn-secondary"
            >
              <Wallet className="h-4 w-4" />
              Facturar consulta
            </Link>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="dashboard-grid">
        <MetricCard
          label="Problemas activos"
          value={selectedProfile.activeProblems.length}
          helper="Visibles para cualquier profesional"
          icon={Activity}
          tone="sky"
        />
        <MetricCard
          label="Alergias visibles"
          value={selectedProfile.allergies.length}
          helper="Destacadas en consulta y receta"
          icon={ShieldAlert}
          tone="amber"
        />
        <MetricCard
          label="Medicacion cronica"
          value={selectedProfile.chronicMedications.length}
          helper="Base para renovaciones y alertas"
          icon={Pill}
          tone="teal"
        />
        <MetricCard
          label="Diagnosticos CIE-10"
          value={selectedProfile.diagnoses.length}
          helper="Codificados para trazabilidad y negocio"
          icon={ClipboardList}
          tone="violet"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.3fr_0.85fr]">
        <aside className="space-y-6">
          <section className="surface-card p-6">
            <h2 className="section-title">Pacientes prioritarios</h2>
            <p className="section-copy">
              Cambia de paciente sin salir del espacio clinico.
            </p>
            <div className="mt-5 space-y-3">
              {state.patients.slice(0, 6).map((patient) => {
                const profile = buildPatientClinicalProfile(patient);
                const isActive = patient.id === selectedPatient.id;

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-sky-200 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{patient.full_name}</p>
                      <span className="pill bg-slate-100 text-slate-700">
                        {profile.diagnoses[0]?.code}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{profile.alerts[0]?.title}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="section-title">Pendientes administrativos</h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">Saldo del paciente</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {formatCurrency(selectedProfile.accountBalance)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Medio preferido: {selectedProfile.preferredPaymentMethod}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">Proximo paso</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cerrar evolucion, emitir receta digital y enviar a caja sin romper el flujo.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <main className="space-y-6">
          <section className="surface-card p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {selectedPatient.full_name}
                  </h2>
                  {selectedProfile.alerts.slice(0, 2).map((alert) => (
                    <span
                      key={alert.title}
                      className={`pill ${
                        alert.severity === "critical"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {alert.title}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    {getAgeLabel(selectedPatient.date_of_birth)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    HC {getPatientDisplayDocument(selectedPatient)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    {selectedProfile.insurerPlan}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    {attendingDoctor ? `Dr. ${attendingDoctor.full_name}` : "Profesional por asignar"}
                  </span>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Encuentro actual</p>
                <p className="mt-2">
                  {currentAppointment
                    ? formatShortDateTime(currentAppointment.scheduled_at)
                    : "Sin turno activo"}
                </p>
                <p className="mt-1">
                  {currentAppointment?.room || "Consultorio por asignar"}
                </p>
              </div>
            </div>

            {aiSummaryVisible ? (
              <div className="mt-6 rounded-[26px] border border-sky-100 bg-sky-50 px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white p-3 text-sky-700">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Resumen IA listo para leer
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sky-900">
                      Paciente con {selectedProfile.diagnoses[0]?.label.toLowerCase()}, alergia destacada a{" "}
                      {selectedProfile.allergies[0]?.toLowerCase()} y necesidad de cerrar seguimiento con receta y control. Recomendacion: validar interacciones, renovar tratamiento y dejar cita de control antes del alta administrativa.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="surface-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title">Evolucion estructurada</h2>
                <p className="section-copy">
                  Lectura rapida para consulta real, con texto util y estructura clara.
                </p>
              </div>
              <span className="pill bg-teal-50 text-teal-700">Autoguardado sugerido</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="surface-muted p-5">
                <h3 className="font-semibold text-slate-900">Subjetivo</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{encounterNote.subjective}</p>
              </article>
              <article className="surface-muted p-5">
                <h3 className="font-semibold text-slate-900">Objetivo</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{encounterNote.objective}</p>
              </article>
              <article className="surface-muted p-5">
                <h3 className="font-semibold text-slate-900">Evaluacion</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{encounterNote.assessment}</p>
              </article>
              <article className="surface-muted p-5">
                <h3 className="font-semibold text-slate-900">Plan</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {encounterNote.plan.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="surface-card p-6 sm:p-7">
            <h2 className="section-title">Timeline clinico</h2>
            <p className="section-copy">
              La historia longitudinal deja de ser un bloque de texto y pasa a ser navegable.
            </p>
            <div className="mt-6 space-y-4">
              {selectedProfile.timeline.map((entry) => (
                <article
                  key={`${entry.date}-${entry.title}`}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{entry.title}</p>
                    <span className="pill bg-slate-100 text-slate-700">
                      {formatShortDateTime(entry.date)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{entry.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="surface-card p-6">
            <h2 className="section-title">Alergias y riesgos</h2>
            <div className="mt-5 space-y-3">
              {selectedProfile.alerts.map((alert) => (
                <div
                  key={alert.title}
                  className={`rounded-2xl border px-4 py-4 ${
                    alert.severity === "critical"
                      ? "border-rose-100 bg-rose-50"
                      : "border-amber-100 bg-amber-50"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{alert.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{alert.context}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="section-title">Diagnosticos CIE-10</h2>
            <div className="mt-5 space-y-3">
              {selectedProfile.diagnoses.map((diagnosis) => (
                <div key={diagnosis.code} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">{diagnosis.code}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{diagnosis.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="section-title">Medicacion cronica</h2>
            <div className="mt-5 space-y-3">
              {selectedProfile.chronicMedications.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="surface-card p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Acciones del episodio</h2>
            <p className="section-copy">
              El objetivo es cerrar consulta, salida clinica y cobro sin perder contexto.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/prescriptions?patientId=${selectedPatient.id}&appointmentId=${currentAppointment?.id ?? ""}&action=new`}
              className="btn-primary"
            >
              <Pill className="h-4 w-4" />
              Emitir receta
            </Link>
            <Link to="/prescriptions?action=new" className="btn-secondary">
              <FilePlus2 className="h-4 w-4" />
              Pedir orden / estudio
            </Link>
            <Link
              to={`/billing?patientId=${selectedPatient.id}&appointmentId=${currentAppointment?.id ?? ""}&action=collect`}
              className="btn-secondary"
            >
              <Wallet className="h-4 w-4" />
              Cerrar con pago
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
