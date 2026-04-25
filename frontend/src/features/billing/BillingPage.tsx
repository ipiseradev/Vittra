import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgeDollarSign,
  Banknote,
  CreditCard,
  Receipt,
  TrendingUp,
  UserRoundX,
  Wallet,
} from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import { EmptyState, ErrorAlert, LoadingSpinner, MetricCard, PageHeader } from "../../components";
import {
  buildAppointmentCharge,
  buildPatientClinicalProfile,
  formatCurrency,
  formatShortDateTime,
  groupRevenueByDoctor,
  isToday,
} from "../../lib/clinicalDemo";
import type { Appointment, Doctor, Patient } from "../../types/domain";

type BillingState = {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
};

export function BillingPage() {
  const location = useLocation();
  const [state, setState] = useState<BillingState>({
    appointments: [],
    patients: [],
    doctors: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [appointments, patients, doctors] = await Promise.all([
          trainityApi.getAppointments().catch(() => []),
          trainityApi.getPatients().catch(() => []),
          trainityApi.getDoctors({ isActive: true }).catch(() => []),
        ]);

        setState({ appointments, patients, doctors });
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar facturacion.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

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

  const completedAppointments = useMemo(
    () => state.appointments.filter((appointment) => appointment.status === "completed"),
    [state.appointments]
  );

  const todaysRevenue = useMemo(
    () =>
      todaysAppointments
        .filter((appointment) => appointment.status === "completed")
        .reduce((total, appointment) => total + buildAppointmentCharge(appointment), 0),
    [todaysAppointments]
  );

  const monthlyRevenue = useMemo(
    () =>
      completedAppointments.reduce(
        (total, appointment) => total + buildAppointmentCharge(appointment),
        0
      ),
    [completedAppointments]
  );

  const noShowRate = useMemo(() => {
    if (state.appointments.length === 0) return 0;

    const noShow = state.appointments.filter((appointment) => appointment.status === "no_show")
      .length;
    return Math.round((noShow / state.appointments.length) * 100);
  }, [state.appointments]);

  const patientsWithDebt = useMemo(
    () =>
      state.patients
        .map((patient) => ({
          patient,
          profile: buildPatientClinicalProfile(patient),
        }))
        .sort((left, right) => right.profile.accountBalance - left.profile.accountBalance)
        .slice(0, 5),
    [state.patients]
  );

  const paymentMethods = useMemo(() => {
    const counters = {
      Tarjeta: 0,
      Transferencia: 0,
      Efectivo: 0,
    };

    state.patients.forEach((patient) => {
      const method = buildPatientClinicalProfile(patient).preferredPaymentMethod;
      counters[method] += 1;
    });

    return Object.entries(counters);
  }, [state.patients]);

  const revenueByDoctor = useMemo(
    () => groupRevenueByDoctor(state.appointments, state.doctors).slice(0, 5),
    [state.appointments, state.doctors]
  );

  const selectedPatient = useMemo(() => {
    const queryPatientId = Number(params.get("patientId") ?? 0);
    if (queryPatientId > 0) {
      return patientById.get(queryPatientId) ?? null;
    }
    return patientsWithDebt[0]?.patient ?? null;
  }, [params, patientById, patientsWithDebt]);

  const selectedPatientProfile = useMemo(
    () => (selectedPatient ? buildPatientClinicalProfile(selectedPatient) : null),
    [selectedPatient]
  );

  const selectedAppointment = useMemo(() => {
    const queryAppointmentId = Number(params.get("appointmentId") ?? 0);
    if (queryAppointmentId > 0) {
      return state.appointments.find((appointment) => appointment.id === queryAppointmentId) ?? null;
    }

    return (
      state.appointments.find((appointment) => appointment.patient_id === selectedPatient?.id) ?? null
    );
  }, [params, state.appointments, selectedPatient]);

  if (loading) {
    return <LoadingSpinner fullscreen label="Cargando indicadores financieros..." />;
  }

  if (state.patients.length === 0) {
    return (
      <div className="page-shell">
        <EmptyState
          icon={Receipt}
          title="No hay datos para facturar"
          description="Carga consultas y pacientes para activar el circuito financiero."
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Operacion financiera"
        title="Facturacion y cierre de episodios"
        description="Una vista para duenios, administracion y recepcion: ingresos del dia, deuda, mix de pagos, no-show e ingresos por profesional."
        actions={
          <>
            <button type="button" className="btn-primary">
              <Receipt className="h-4 w-4" />
              Emitir comprobante
            </button>
            <Link to="/payments" className="btn-secondary">
              <Wallet className="h-4 w-4" />
              Ir a pagos
            </Link>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="dashboard-grid">
        <MetricCard
          label="Ingresos del dia"
          value={formatCurrency(todaysRevenue)}
          helper="Cobranza sobre consultas cerradas hoy"
          icon={Banknote}
          tone="teal"
        />
        <MetricCard
          label="Ingresos del mes"
          value={formatCurrency(monthlyRevenue)}
          helper="Facturacion acumulada sobre atenciones completadas"
          icon={TrendingUp}
          tone="sky"
        />
        <MetricCard
          label="Pacientes con deuda"
          value={patientsWithDebt.length}
          helper="Prioridad para recepcion y caja"
          icon={BadgeDollarSign}
          tone="amber"
        />
        <MetricCard
          label="No-show rate"
          value={`${noShowRate}%`}
          helper="Indicador comercial y operativo"
          icon={UserRoundX}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="surface-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title">Caja del dia</h2>
                <p className="section-copy">
                  Que entro, que falta cobrar y donde se esta perdiendo dinero.
                </p>
              </div>
              <span className="pill bg-slate-100 text-slate-700">
                {todaysAppointments.length} atenciones hoy
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {todaysAppointments.slice(0, 6).map((appointment) => {
                const patient = patientById.get(appointment.patient_id);
                const doctor = doctorById.get(appointment.doctor_id);
                const amount = buildAppointmentCharge(appointment);

                return (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {patient?.full_name ?? `Paciente #${appointment.patient_id}`}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {doctor ? `Dr. ${doctor.full_name}` : "Profesional por asignar"} ·{" "}
                          {formatShortDateTime(appointment.scheduled_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-950">
                          {formatCurrency(amount)}
                        </p>
                        <span
                          className={`pill ${
                            appointment.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : appointment.status === "no_show"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {appointment.status === "completed"
                            ? "Listo para cobro"
                            : appointment.status === "no_show"
                              ? "Perdida por no-show"
                              : "Pendiente de cierre"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="surface-card p-6 sm:p-7">
            <h2 className="section-title">Ingresos por profesional</h2>
            <p className="section-copy">
              Este indicador ayuda a vender Vittra como consola de negocio, no solo clinica.
            </p>
            <div className="mt-6 space-y-3">
              {revenueByDoctor.map((item) => (
                <div
                  key={item.doctorName}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.doctorName}</p>
                    <p className="text-lg font-semibold text-slate-950">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.completed} consultas completadas
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-6 sm:p-7">
            <h2 className="section-title">Pacientes con deuda</h2>
            <p className="section-copy">
              Recepcion y administracion pueden priorizar cobranza sin perder el contexto del paciente.
            </p>
            <div className="mt-6 space-y-3">
              {patientsWithDebt.map(({ patient, profile }) => (
                <div
                  key={patient.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    patient.id === selectedPatient?.id
                      ? "border-sky-200 bg-sky-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{patient.full_name}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Deuda actual: {formatCurrency(profile.accountBalance)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Metodo frecuente: {profile.preferredPaymentMethod}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-6 sm:p-7">
            <h2 className="section-title">Pagos por metodo</h2>
            <div className="mt-6 space-y-3">
              {paymentMethods.map(([method, total]) => (
                <div
                  key={method}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="font-semibold text-slate-900">{method}</p>
                  <span className="pill bg-white text-slate-700">{total}</span>
                </div>
              ))}
            </div>
          </section>

          {selectedPatient && selectedPatientProfile ? (
            <section className="surface-card p-6 sm:p-7">
              <h2 className="section-title">Cierre del flujo actual</h2>
              <p className="section-copy">
                La consulta se considera realmente cerrada cuando termina tambien lo financiero.
              </p>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">{selectedPatient.full_name}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Saldo pendiente: {formatCurrency(selectedPatientProfile.accountBalance)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedAppointment
                      ? `Ultimo episodio: ${formatShortDateTime(selectedAppointment.scheduled_at)}`
                      : "Sin episodio vinculado"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-primary">
                    <CreditCard className="h-4 w-4" />
                    Registrar pago
                  </button>
                  <Link to="/payments" className="btn-secondary">
                    <Wallet className="h-4 w-4" />
                    Ver caja
                  </Link>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
