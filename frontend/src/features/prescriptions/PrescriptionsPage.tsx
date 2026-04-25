import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardCheck,
  Download,
  FileSignature,
  Pill,
  RefreshCcw,
  ShieldPlus,
  Wallet,
} from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import { EmptyState, ErrorAlert, LoadingSpinner, MetricCard, PageHeader } from "../../components";
import { buildPatientClinicalProfile, formatShortDateTime } from "../../lib/clinicalDemo";
import type { Appointment, Patient } from "../../types/domain";

function buildPrescriptionItems(patient: Patient) {
  const profile = buildPatientClinicalProfile(patient);

  return profile.chronicMedications.slice(0, 3).map((item, index) => ({
    medication: item.split(" ").slice(0, 2).join(" "),
    dose: index === 0 ? "1 comprimido" : "1 dosis",
    frequency: index === 0 ? "cada 12 h" : "cada 24 h",
    duration: index === 0 ? "30 dias" : "60 dias",
    indication:
      index === 0
        ? "Mantener control metabolico y adherencia."
        : "Continuar tratamiento cronico con reevaluacion clinica.",
  }));
}

export function PrescriptionsPage() {
  const location = useLocation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [patientsData, appointmentsData] = await Promise.all([
          trainityApi.getPatients().catch(() => []),
          trainityApi.getAppointments().catch(() => []),
        ]);

        setPatients(patientsData);
        setAppointments(appointmentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar prescripciones.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    const queryPatientId = Number(params.get("patientId") ?? 0);

    if (queryPatientId > 0) {
      setSelectedPatientId(queryPatientId);
      return;
    }

    if (!selectedPatientId && patients[0]) {
      setSelectedPatientId(patients[0].id);
    }
  }, [params, patients, selectedPatientId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );

  const selectedProfile = useMemo(
    () => (selectedPatient ? buildPatientClinicalProfile(selectedPatient) : null),
    [selectedPatient]
  );

  const selectedAppointment = useMemo(() => {
    const queryAppointmentId = Number(params.get("appointmentId") ?? 0);
    if (queryAppointmentId > 0) {
      return appointments.find((appointment) => appointment.id === queryAppointmentId) ?? null;
    }

    return (
      appointments.find((appointment) => appointment.patient_id === selectedPatientId) ?? null
    );
  }, [appointments, params, selectedPatientId]);

  const prescriptionItems = useMemo(
    () => (selectedPatient ? buildPrescriptionItems(selectedPatient) : []),
    [selectedPatient]
  );

  const interactionAlerts = useMemo(() => {
    if (!selectedProfile) return [];

    return [
      `Verificar alergia a ${selectedProfile.allergies[0]}.`,
      "Chequear duplicidad terapeutica antes de firmar.",
      "Validar medicacion cronica antes de renovar.",
    ];
  }, [selectedProfile]);

  if (loading) {
    return <LoadingSpinner fullscreen label="Cargando modulo de prescripciones..." />;
  }

  if (!selectedPatient || !selectedProfile) {
    return (
      <div className="page-shell">
        <EmptyState
          icon={Pill}
          title="No hay contexto clinico para prescribir"
          description="Carga pacientes y encuentros para empezar a emitir recetas digitales."
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Salida clinica"
        title="Prescripcion digital conectada"
        description="Recetas con contexto del paciente, alertas de seguridad, plan de tratamiento, PDF y firma como parte natural del encounter."
        actions={
          <>
            <button type="button" className="btn-primary">
              <Download className="h-4 w-4" />
              Generar PDF
            </button>
            <button type="button" className="btn-secondary">
              <FileSignature className="h-4 w-4" />
              Firmar digitalmente
            </button>
            <Link
              to={`/billing?patientId=${selectedPatient.id}&appointmentId=${selectedAppointment?.id ?? ""}&action=collect`}
              className="btn-secondary"
            >
              <Wallet className="h-4 w-4" />
              Facturar episodio
            </Link>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="dashboard-grid">
        <MetricCard
          label="Recetas listas"
          value={prescriptionItems.length}
          helper="Items preparados para PDF y firma"
          icon={Pill}
          tone="sky"
        />
        <MetricCard
          label="Por renovar"
          value={Math.max(selectedProfile.chronicMedications.length - 1, 1)}
          helper="Renovaciones ligadas al tratamiento cronico"
          icon={RefreshCcw}
          tone="amber"
        />
        <MetricCard
          label="Seguimiento activo"
          value={selectedProfile.treatmentPlan.length}
          helper="Plan terapeutico asociado a la receta"
          icon={ClipboardCheck}
          tone="teal"
        />
        <MetricCard
          label="Alertas farmacologicas"
          value={interactionAlerts.length}
          helper="Interacciones y seguridad visibles"
          icon={ShieldPlus}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.25fr_0.9fr]">
        <aside className="space-y-6">
          <section className="surface-card p-6">
            <h2 className="section-title">Pacientes con renovacion</h2>
            <p className="section-copy">
              La renovacion deja de ser informal y pasa a quedar trazada.
            </p>
            <div className="mt-5 space-y-3">
              {patients.slice(0, 6).map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    patient.id === selectedPatient.id
                      ? "border-sky-200 bg-sky-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{patient.full_name}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Renovar, validar alertas y confirmar proximo control.
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="section-title">Bandeja de renovaciones</h2>
            <div className="mt-5 space-y-3">
              {selectedProfile.chronicMedications.slice(0, 3).map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">{item}</p>
                  <p className="mt-1 text-sm text-slate-500">Revision sugerida en 30 dias.</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-6">
          <section className="surface-card p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{selectedPatient.full_name}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedAppointment
                    ? `Encuentro vinculado: ${formatShortDateTime(selectedAppointment.scheduled_at)}`
                    : "Sin encounter activo. La receta puede quedar como borrador."}
                </p>
              </div>
              <span className="pill bg-slate-100 text-slate-700">Plan terapeutico activo</span>
            </div>

            <div className="mt-6 space-y-4">
              {prescriptionItems.map((item) => (
                <article
                  key={`${item.medication}-${item.frequency}`}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{item.medication}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.dose} · {item.frequency} · {item.duration}
                      </p>
                    </div>
                    <span className="pill bg-teal-50 text-teal-700">PDF listo</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{item.indication}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="surface-card p-6 sm:p-7">
            <h2 className="section-title">Plan de tratamiento</h2>
            <p className="section-copy">
              La receta se complementa con indicaciones y proximos pasos.
            </p>
            <div className="mt-6 space-y-3">
              {selectedProfile.treatmentPlan.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="surface-card p-6">
            <h2 className="section-title">Alertas de seguridad</h2>
            <div className="mt-5 space-y-3">
              {interactionAlerts.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="section-title">Contexto del paciente</h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">Alergias</p>
                <p className="mt-2 text-sm text-slate-600">{selectedProfile.allergies.join(", ")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">Diagnosticos</p>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedProfile.diagnoses.map((diagnosis) => diagnosis.code).join(", ")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">Renovacion vinculada</p>
                <p className="mt-2 text-sm text-slate-600">
                  Proxima revision sugerida en 30 dias, con contador y motivo trazables.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
