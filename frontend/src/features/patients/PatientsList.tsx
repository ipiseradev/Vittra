import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Edit2,
  Mail,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
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
import type { Patient } from "../../types/domain";

type PatientFormState = {
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
};

const initialFormState: PatientFormState = {
  full_name: "",
  email: "",
  phone: "",
  is_active: true,
};

export function PatientsList() {
  const location = useLocation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [form, setForm] = useState<PatientFormState>(initialFormState);

  const debouncedSearch = useDebouncedValue(searchTerm, 200);

  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        setError(null);
        const data = await trainityApi.getPatients();
        setPatients(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los pacientes."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesStatus =
        filterActive === "all" ||
        (filterActive === "active" ? patient.is_active : !patient.is_active);
      const query = debouncedSearch.toLowerCase();
      const matchesSearch =
        !query ||
        patient.full_name.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query) ||
        (patient.phone ?? "").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [patients, filterActive, debouncedSearch]);

  const stats = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    return {
      total: patients.length,
      active: patients.filter((patient) => patient.is_active).length,
      inactive: patients.filter((patient) => !patient.is_active).length,
      newThisMonth: patients.filter((patient) => {
        const createdAt = new Date(patient.created_at);
        return (
          createdAt.getMonth() === thisMonth && createdAt.getFullYear() === thisYear
        );
      }).length,
    };
  }, [patients]);

  function resetForm() {
    setForm(initialFormState);
    setEditingPatientId(null);
  }

  function openCreateDrawer() {
    resetForm();
    setDrawerOpen(true);
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "new") {
      openCreateDrawer();
    }
  }, [location.search]);

  function openEditDrawer(patient: Patient) {
    setEditingPatientId(patient.id);
    setForm({
      full_name: patient.full_name,
      email: patient.email,
      phone: patient.phone ?? "",
      is_active: patient.is_active,
    });
    setDrawerOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (editingPatientId) {
        const updatedPatient = await trainityApi.updatePatient(editingPatientId, form);
        setPatients((current) =>
          current.map((patient) =>
            patient.id === editingPatientId ? updatedPatient : patient
          )
        );
        setFeedback("Paciente actualizado correctamente.");
      } else {
        const createdPatient = await trainityApi.createPatient(form);
        setPatients((current) => [createdPatient, ...current]);
        setFeedback("Paciente creado correctamente.");
      }

      setDrawerOpen(false);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el paciente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner fullscreen label="Cargando pacientes..." />;
  }

  return (
    <>
      <div className="page-shell">
        <PageHeader
          eyebrow="Base clínica"
          title="Pacientes"
          description="Gestioná la base de pacientes con una vista más clara, filtros rápidos y un flujo de alta preparado para demo."
          actions={
            <>
              <button type="button" onClick={openCreateDrawer} className="btn-primary">
                <Plus className="h-4 w-4" />
                Nuevo paciente
              </button>
            </>
          }
        />

        {error ? <ErrorAlert message={error} onDismiss={() => setError(null)} /> : null}
        {feedback ? <SuccessAlert message={feedback} /> : null}

        <section className="dashboard-grid">
          <MetricCard
            label="Total pacientes"
            value={stats.total}
            helper="Base completa en Vittra"
            icon={Users}
            tone="sky"
          />
          <MetricCard
            label="Activos"
            value={stats.active}
            helper="Disponibles para atención"
            icon={UserRound}
            tone="teal"
          />
          <MetricCard
            label="Inactivos"
            value={stats.inactive}
            helper="Casos pausados o cerrados"
            icon={X}
            tone="slate"
          />
          <MetricCard
            label="Altas del mes"
            value={stats.newThisMonth}
            helper="Nuevos pacientes registrados"
            icon={Plus}
            tone="violet"
          />
        </section>

        <section className="surface-card p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="input-field pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "Todos"],
                ["active", "Activos"],
                ["inactive", "Inactivos"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterActive(value)}
                  className={
                    filterActive === value
                      ? "btn-primary"
                      : "btn-secondary"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end">
              <span className="pill bg-slate-100 text-slate-700">
                {filteredPatients.length} visibles
              </span>
            </div>
          </div>
        </section>

        {filteredPatients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No encontramos pacientes"
            description="Probá cambiando los filtros o cargá un nuevo paciente para poblar la demo."
            action={{ label: "Nuevo paciente", onClick: openCreateDrawer }}
          />
        ) : (
          <section className="table-shell">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="table-head">Paciente</th>
                    <th className="table-head">Contacto</th>
                    <th className="table-head">Estado</th>
                    <th className="table-head">Alta</th>
                    <th className="table-head text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="transition hover:bg-slate-50/80">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                            {patient.full_name
                              .split(" ")
                              .slice(0, 2)
                              .map((chunk) => chunk[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {patient.full_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              ID #{patient.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="font-medium text-slate-700">{patient.email}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {patient.phone || "Sin teléfono cargado"}
                        </p>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`pill ${
                            patient.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {patient.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="table-cell">
                        {new Intl.DateTimeFormat("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(patient.created_at))}
                      </td>
                      <td className="table-cell">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => openEditDrawer(patient)}
                            className="btn-secondary"
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {filteredPatients.map((patient) => (
                <article key={patient.id} className="surface-muted p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {patient.full_name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{patient.email}</p>
                    </div>
                    <span
                      className={`pill ${
                        patient.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {patient.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {patient.phone || "Sin teléfono"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {patient.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditDrawer(patient)}
                    className="btn-secondary mt-4 w-full"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar paciente
                  </button>
                </article>
              ))}
            </div>
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
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-[0_30px_90px_-24px_rgba(15,23,42,0.45)] transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="page-kicker text-[11px] tracking-[0.2em]">Ficha rápida</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {editingPatientId ? "Editar paciente" : "Nuevo paciente"}
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
              <label className="field-label" htmlFor="full_name">
                Nombre completo
              </label>
              <input
                id="full_name"
                className="input-field"
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, full_name: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="patient_email">
                Email
              </label>
              <input
                id="patient_email"
                type="email"
                className="input-field"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="patient_phone">
                Teléfono
              </label>
              <input
                id="patient_phone"
                className="input-field"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </div>
            <label className="surface-muted flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold text-slate-900">Paciente activo</p>
                <p className="mt-1 text-sm text-slate-600">
                  Se mostrará disponible en agenda y paneles operativos.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
                className="h-5 w-5 rounded border-slate-300 text-sky-700 focus:ring-sky-200"
              />
            </label>
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
                {submitting ? "Guardando..." : editingPatientId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </>
  );
}
