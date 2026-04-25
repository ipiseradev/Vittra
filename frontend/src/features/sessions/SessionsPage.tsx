import { useEffect, useMemo, useState } from "react";
import { PlayCircle, Search, Users, Video } from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import {
  EmptyState,
  ErrorAlert,
  LoadingSpinner,
  MetricCard,
  PageHeader,
} from "../../components";
import type { ClassSession } from "../../types/domain";

export function SessionsPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true);
        setError(null);
        const data = await trainityApi.getSessions();
        setSessions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar las sesiones."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, []);

  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const query = searchTerm.toLowerCase();
        return (
          !query ||
          session.title.toLowerCase().includes(query) ||
          session.coach_name.toLowerCase().includes(query)
        );
      }),
    [sessions, searchTerm]
  );

  const stats = useMemo(() => {
    const totalCapacity = filteredSessions.reduce(
      (accumulator, session) => accumulator + session.capacity,
      0
    );

    return {
      total: filteredSessions.length,
      totalCapacity,
      averageCapacity:
        filteredSessions.length > 0
          ? Math.round(totalCapacity / filteredSessions.length)
          : 0,
    };
  }, [filteredSessions]);

  if (loading) {
    return <LoadingSpinner fullscreen label="Cargando sesiones..." />;
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Sesiones"
        title="Sesiones de clase"
        description="Una vista secundaria de Vittra para mostrar agenda grupal, capacidad y coordinación operativa con una estética consistente."
      />

      {error ? <ErrorAlert message={error} onDismiss={() => setError(null)} /> : null}

      <section className="dashboard-grid">
        <MetricCard
          label="Sesiones activas"
          value={stats.total}
          helper="Clases visibles en agenda"
          icon={Video}
          tone="sky"
        />
        <MetricCard
          label="Capacidad total"
          value={stats.totalCapacity}
          helper="Lugares disponibles sumados"
          icon={Users}
          tone="teal"
        />
        <MetricCard
          label="Promedio"
          value={stats.averageCapacity}
          helper="Capacidad por clase"
          icon={PlayCircle}
          tone="violet"
        />
        <MetricCard
          label="Modalidad"
          value="Demo"
          helper="Vista lista para presentación"
          icon={Video}
          tone="slate"
        />
      </section>

      <section className="surface-card p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título o entrenador"
            className="input-field pl-11"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </section>

      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No hay sesiones para mostrar"
          description="Probá otra búsqueda o cargá nuevas sesiones desde el backend."
        />
      ) : (
        <section className="grid gap-4">
          {filteredSessions.map((session) => (
            <article
              key={session.id}
              className="surface-card flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="text-lg font-semibold text-slate-950">{session.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Entrenador: {session.coach_name}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    {new Intl.DateTimeFormat("es-AR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(session.starts_at))}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">
                    {session.capacity} lugares
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" className="btn-secondary">
                  Ver detalles
                </button>
                <button type="button" className="btn-primary">
                  Editar sesión
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
