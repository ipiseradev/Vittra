import { FormEvent, useEffect, useMemo, useState } from "react";

import { trainityApi } from "../../api/trainityApi";
import type { Client, Reservation } from "../../types/domain";

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

function StatusBadge({ status }: { status: string }) {
  const colors = {
    booked: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    checked_in: "bg-blue-50 text-blue-700 ring-blue-200",
    cancelled: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${colors[status as keyof typeof colors] || colors.cancelled}`}>
      {status === 'booked' ? 'Reservado' : status === 'checked_in' ? 'Presente' : 'Cancelado'}
    </span>
  );
}

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "booked" | "checked_in" | "cancelled">("all");

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesSearch = !search || 
        r.client_name.toLowerCase().includes(search.toLowerCase()) ||
        r.class_title.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [reservations, search, statusFilter]);

  async function fetchReservations(params?: { search?: string; status?: string }) {
    setLoadingList(true);
    try {
      const data = await trainityApi.getReservations({
        search: params?.search || "",
        status: params && params.status !== "all" ? params.status : undefined,
      });
      setReservations(data);
    } catch {
      setFeedback({ type: "error", message: "No se pudieron cargar las reservas." });
      setReservations([]);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await fetchReservations({ search, status: statusFilter });
  }

  async function onCancel(reservationId: number) {
    if (!window.confirm("¿Cancelar esta reserva?")) return;
    try {
      await trainityApi.cancelReservation(reservationId);
      setFeedback({ type: "success", message: "Reserva cancelada correctamente." });
      await fetchReservations();
    } catch {
      setFeedback({ type: "error", message: "Error al cancelar reserva." });
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    fetchReservations();
  }

  const totalReservations = filteredReservations.length;
  const booked = filteredReservations.filter(r => r.status === 'booked').length;
  const present = filteredReservations.filter(r => r.status === 'checked_in').length;
  const cancelled = filteredReservations.filter(r => r.status === 'cancelled').length;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reservas</h1>
            <p className="mt-1 text-sm text-slate-600">Gestioná las reservas de clases de tus clientes.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:min-w-[500px]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
              <p className="text-xl font-semibold text-slate-900">{totalReservations}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Reservadas</p>
              <p className="text-xl font-semibold text-emerald-800">{booked}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Presentes</p>
              <p className="text-xl font-semibold text-blue-800">{present}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Canceladas</p>
              <p className="text-xl font-semibold text-slate-900">{cancelled}</p>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={onSearch} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Buscar y filtrar</h2>
          <p className="mt-1 text-sm text-slate-600">Por cliente o clase.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_auto_auto]">
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Buscar cliente o clase"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">Todos los estados</option>
            <option value="booked">Reservadas</option>
            <option value="checked_in">Presentes</option>
            <option value="cancelled">Canceladas</option>
          </select>
          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800" type="submit">
            Buscar
          </button>
          <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button" onClick={resetFilters}>
            Limpiar
          </button>
        </div>
      </form>

      {feedback && (
        <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
          feedback.type === "success" 
            ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {feedback.message}
        </div>
      )}

      {loadingList && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-600">Cargando reservas...</p>
        </div>
      )}

      {!loadingList && filteredReservations.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-base font-semibold text-slate-800">No hay reservas</h3>
          <p className="mt-1 text-sm text-slate-600">Cuando haya reservas aparecerán aquí.</p>
        </div>
      )}

      {!loadingList && filteredReservations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="truncate text-lg font-semibold text-slate-900">{reservation.client_name}</h3>
                    <StatusBadge status={reservation.status} />
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{reservation.class_title}</p>
                  <p className="text-xs text-slate-500">ID Reserva: #{reservation.id}</p>
                </div>
                {reservation.status !== 'cancelled' && (
                  <button
                    className="ml-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition whitespace-nowrap"
                    onClick={() => onCancel(reservation.id)}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
