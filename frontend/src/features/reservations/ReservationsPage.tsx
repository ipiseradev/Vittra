import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarCheck2, Search, XCircle } from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import {
  EmptyState,
  ErrorAlert,
  LoadingSpinner,
  MetricCard,
  PageHeader,
  SuccessAlert,
} from "../../components";
import type { Reservation } from "../../types/domain";

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

const statusLabelMap: Record<Reservation["status"], string> = {
  booked: "Reservada",
  checked_in: "Check-in",
  cancelled: "Cancelada",
};

const statusToneMap: Record<Reservation["status"], string> = {
  booked: "bg-emerald-50 text-emerald-700",
  checked_in: "bg-sky-50 text-sky-700",
  cancelled: "bg-slate-100 text-slate-700",
};

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "booked" | "checked_in" | "cancelled"
  >("all");

  async function fetchReservations(params?: { search?: string; status?: string }) {
    try {
      setLoading(true);
      const data = await trainityApi.getReservations({
        search: params?.search ?? "",
        status: params?.status && params.status !== "all" ? params.status : undefined,
      });
      setReservations(data);
    } catch {
      setFeedback({
        type: "error",
        message: "No se pudieron cargar las reservas.",
      });
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "all" || reservation.status === statusFilter;
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        reservation.client_name.toLowerCase().includes(query) ||
        reservation.class_title.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [reservations, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: filteredReservations.length,
      booked: filteredReservations.filter((item) => item.status === "booked").length,
      checkedIn: filteredReservations.filter((item) => item.status === "checked_in")
        .length,
      cancelled: filteredReservations.filter((item) => item.status === "cancelled")
        .length,
    }),
    [filteredReservations]
  );

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await fetchReservations({ search, status: statusFilter });
  }

  async function onCancel(reservationId: number) {
    try {
      await trainityApi.cancelReservation(reservationId);
      setFeedback({
        type: "success",
        message: "Reserva cancelada correctamente.",
      });
      await fetchReservations({ search, status: statusFilter });
    } catch {
      setFeedback({
        type: "error",
        message: "No se pudo cancelar la reserva.",
      });
    }
  }

  if (loading) {
    return <LoadingSpinner fullscreen label="Cargando reservas..." />;
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Reservas"
        title="Reservas de clases"
        description="Un módulo secundario pero consistente para mostrar reservas, check-ins y estados operativos sin salir del lenguaje visual de Vittra."
      />

      {feedback?.type === "error" ? (
        <ErrorAlert message={feedback.message} onDismiss={() => setFeedback(null)} />
      ) : null}
      {feedback?.type === "success" ? (
        <SuccessAlert message={feedback.message} />
      ) : null}

      <section className="dashboard-grid">
        <MetricCard
          label="Reservas visibles"
          value={stats.total}
          helper="Resultado según filtros"
          icon={BookOpen}
          tone="sky"
        />
        <MetricCard
          label="Reservadas"
          value={stats.booked}
          helper="Pendientes de check-in"
          icon={CalendarCheck2}
          tone="teal"
        />
        <MetricCard
          label="Con check-in"
          value={stats.checkedIn}
          helper="Asistencia confirmada"
          icon={CalendarCheck2}
          tone="violet"
        />
        <MetricCard
          label="Canceladas"
          value={stats.cancelled}
          helper="Bajas registradas"
          icon={XCircle}
          tone="slate"
        />
      </section>

      <form onSubmit={onSearch} className="surface-card p-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.7fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-11"
              placeholder="Buscar por cliente o clase"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="select-field"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as typeof statusFilter)
            }
          >
            <option value="all">Todos los estados</option>
            <option value="booked">Reservadas</option>
            <option value="checked_in">Check-in</option>
            <option value="cancelled">Canceladas</option>
          </select>
          <button type="submit" className="btn-primary">
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              fetchReservations();
            }}
            className="btn-secondary"
          >
            Limpiar
          </button>
        </div>
      </form>

      {filteredReservations.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No hay reservas para mostrar"
          description="Probá ajustando la búsqueda o cargando más reservas en el backend."
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {filteredReservations.map((reservation) => (
            <article key={reservation.id} className="surface-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-950">
                    {reservation.client_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {reservation.class_title}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Reserva #{reservation.id}
                  </p>
                </div>
                <span className={`pill ${statusToneMap[reservation.status]}`}>
                  {statusLabelMap[reservation.status]}
                </span>
              </div>
              {reservation.status !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() => onCancel(reservation.id)}
                  className="btn-secondary mt-6 text-rose-700"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar reserva
                </button>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
