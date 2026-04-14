import { FormEvent, useEffect, useMemo, useState } from "react";

import { trainityApi } from "../../api/trainityApi";
import type { Client, CreateClientPayload, UpdateClientPayload } from "../../types/domain";

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function SecondaryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
      {label}
    </span>
  );
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingClientId, setEditingClientId] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState<CreateClientPayload>({
    full_name: "",
    email: "",
    phone: "",
    is_active: true,
  });

  const [editForm, setEditForm] = useState<UpdateClientPayload>({});

  const isActiveQuery = useMemo(() => {
    if (statusFilter === "all") return undefined;
    return statusFilter === "active";
  }, [statusFilter]);

  const totalClients = clients.length;
  const activeClients = clients.filter((client) => client.is_active).length;
  const inactiveClients = clients.filter((client) => !client.is_active).length;

  async function fetchClients(params?: {
    search?: string;
    status?: "all" | "active" | "inactive";
  }) {
    setLoadingList(true);

    const effectiveSearch = params?.search ?? search;
    const effectiveStatus = params?.status ?? statusFilter;
    const effectiveIsActive =
      effectiveStatus === "all" ? undefined : effectiveStatus === "active";

    try {
      const data = await trainityApi.getClients({
        search: effectiveSearch.trim() || undefined,
        isActive: effectiveIsActive,
      });
      setClients(data);
    } catch (fetchError) {
      setFeedback({
        type: "error",
        message:
          fetchError instanceof Error
            ? fetchError.message
            : "No se pudieron cargar los clientes.",
      });
      setClients([]);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, [isActiveQuery]);

  useEffect(() => {
    if (!feedback) return;

    const timeout = setTimeout(() => {
      setFeedback(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [feedback]);

  async function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    await fetchClients();
  }

  async function onCreateClient(event: FormEvent) {
    event.preventDefault();
    if (!window.confirm("¿Querés crear este cliente?")) return;

    setCreating(true);
    try {
      await trainityApi.createClient({
        ...createForm,
        phone: createForm.phone?.trim() ? createForm.phone.trim() : undefined,
        gym_id: createForm.gym_id || null,
      });

      setCreateForm({
        full_name: "",
        email: "",
        phone: "",
        is_active: true,
      });

      setFeedback({
        type: "success",
        message: "Cliente creado correctamente.",
      });

      await fetchClients();
    } catch (createError) {
      setFeedback({
        type: "error",
        message:
          createError instanceof Error
            ? createError.message
            : "No se pudo crear el cliente.",
      });
    } finally {
      setCreating(false);
    }
  }

  function startEdit(client: Client) {
    setEditingClientId(client.id);
    setEditForm({
      full_name: client.full_name,
      email: client.email,
      phone: client.phone ?? "",
      is_active: client.is_active,
      gym_id: client.gym_id ?? null,
    });

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  async function onUpdateClient(event: FormEvent) {
    event.preventDefault();
    if (!editingClientId) return;

    setUpdating(true);
    try {
      await trainityApi.updateClient(editingClientId, {
        ...editForm,
        phone: editForm.phone?.trim() ? editForm.phone.trim() : undefined,
      });

      setEditingClientId(null);
      setEditForm({});
      setFeedback({
        type: "success",
        message: "Cliente actualizado correctamente.",
      });

      await fetchClients();
    } catch (updateError) {
      setFeedback({
        type: "error",
        message:
          updateError instanceof Error
            ? updateError.message
            : "No se pudo actualizar el cliente.",
      });
    } finally {
      setUpdating(false);
    }
  }

  async function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setFeedback(null);
    await fetchClients({ search: "", status: "all" });
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Clientes</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gestioná la clientela del estudio, su estado y sus datos principales.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:min-w-[460px]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{totalClients}</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Activos
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">{activeClients}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Inactivos
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{inactiveClients}</p>
            </div>
          </div>
        </div>
      </header>

      <form
        onSubmit={onSearchSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Buscar y filtrar</h2>
          <p className="mt-1 text-sm text-slate-600">
            Encontrá clientes por nombre, correo o teléfono.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_auto_auto]">
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Buscar por nombre, correo electrónico o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <button
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            type="submit"
          >
            Buscar
          </button>

          <button
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={resetFilters}
          >
            Limpiar
          </button>
        </div>
      </form>

      <form
        onSubmit={onCreateClient}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Nuevo cliente</h2>
          <p className="mt-1 text-sm text-slate-600">
            Agregá un nuevo cliente al sistema.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            required
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Nombre completo"
            value={createForm.full_name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))}
          />

          <input
            required
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            type="email"
            placeholder="Correo electrónico"
            value={createForm.email}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
          />

          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Teléfono"
            value={createForm.phone ?? ""}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
          />

          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            type="number"
            min={1}
            placeholder="ID del gimnasio (opcional)"
            value={createForm.gym_id ?? ""}
            onChange={(e) =>
              setCreateForm((prev) => ({
                ...prev,
                gym_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />

          <button
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={creating}
          >
            {creating ? "Creando..." : "Agregar cliente"}
          </button>
        </div>
      </form>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loadingList && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Cargando clientes...</p>
        </div>
      )}

      {!loadingList && clients.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-800">Todavía no hay clientes</p>
          <p className="mt-1 text-sm text-slate-600">
            Agregá tu primer cliente para empezar a gestionar el estudio.
          </p>
        </div>
      )}

      {!loadingList && clients.length > 0 && (
        <ul className="grid gap-4">
          {clients.map((client) => (
            <li
              key={client.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-semibold text-slate-900">
                      {client.full_name}
                    </h3>
                    <StatusBadge active={client.is_active} />
                    <SecondaryBadge
                      label={client.gym_id ? `Gimnasio #${client.gym_id}` : "Sin gimnasio"}
                    />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Correo electrónico
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-700">{client.email}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Teléfono
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {client.phone || "Sin teléfono"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex w-full items-center justify-end md:w-auto">
                  <button
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:w-auto"
                    onClick={() => startEdit(client)}
                    type="button"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingClientId && (
        <form
          onSubmit={onUpdateClient}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Editar cliente</h2>
            <p className="mt-1 text-sm text-slate-600">
              Actualizá los datos del cliente seleccionado.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              value={editForm.full_name ?? ""}
              onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Nombre completo"
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              type="email"
              value={editForm.email ?? ""}
              onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Correo electrónico"
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              value={editForm.phone ?? ""}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Teléfono"
            />

            <select
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              value={editForm.is_active ? "active" : "inactive"}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  is_active: e.target.value === "active",
                }))
              }
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>

            <div className="flex gap-2 md:col-span-2 xl:col-span-1">
              <button
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={updating}
              >
                {updating ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                type="button"
                onClick={() => {
                  setEditingClientId(null);
                  setEditForm({});
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}