import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Plus, Calendar, User, Clock, MapPin, Trash2, Edit2, X,
  CheckCircle2, AlertCircle, Users, Download, Filter, ChevronDown
} from "lucide-react";
import { trainityApi } from "../../api/trainityApi";
import type { Appointment, CreateAppointmentPayload, Doctor, Patient, UpdateAppointmentPayload } from "../../types/domain";

// --- Constantes y Configuraciones (Extraídas para mejor rendimiento) ---
const STATUS_CONFIG: Record<Appointment["status"], { bg: string; text: string; ring: string; label: string; icon: string }> = {
  scheduled: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200/50", label: "Programada", icon: "⏳" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200/50", label: "Completada", icon: "✓" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200/50", label: "Cancelada", icon: "✕" },
  no_show: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200/50", label: "No asistió", icon: "⚠" },
  rescheduled: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200/50", label: "Reprogramada", icon: "↻" },
};

const TYPE_CONFIG: Record<Appointment["appointment_type"], { label: string; color: string }> = {
  consultation: { label: "Consulta", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  follow_up: { label: "Seguimiento", color: "bg-purple-50 text-purple-700 border-purple-100" },
  procedure: { label: "Procedimiento", color: "bg-orange-50 text-orange-700 border-orange-100" },
  checkup: { label: "Control", color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
};

const INITIAL_FORM: CreateAppointmentPayload = {
  patient_id: 0, doctor_id: 0, appointment_type: "consultation",
  scheduled_at: "", duration_minutes: 30, notes: "", room: "",
};

// --- Subcomponentes de UI ---
const Badge = ({ config, isType = false }: { config: any, isType?: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isType ? `border ${config.color}` : `ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}`}`}>
    {!isType && <span>{config.icon}</span>}
    {config.label}
  </span>
);

const StatsCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className={`p-2 rounded-lg ${color}`}>{Icon}</div>
    </div>
    <div className="text-3xl font-bold text-slate-900">{value}</div>
  </div>
);

// --- Componente Principal ---
export function AppointmentsPage() {
  const [data, setData] = useState({ appointments: [] as Appointment[], patients: [] as Patient[], doctors: [] as Doctor[] });
  const [ui, setUi] = useState({ loading: true, creating: false, updating: false, showForm: false });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [filters, setFilters] = useState({ status: "all" as Appointment["status"] | "all", doctor: "all" as number | "all" });
  
  const [createForm, setCreateForm] = useState<CreateAppointmentPayload>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UpdateAppointmentPayload>({});

  useEffect(() => {
    Promise.all([trainityApi.getAppointments(), trainityApi.getPatients({ isActive: true }), trainityApi.getDoctors({ isActive: true })])
      .then(([appointments, patients, doctors]) => setData({ appointments, patients, doctors }))
      .catch(err => showFeedback("error", err.message))
      .finally(() => setUi(prev => ({ ...prev, loading: false })));
  }, []);

  useEffect(() => {
    if (feedback) { const t = setTimeout(() => setFeedback(null), 4000); return () => clearTimeout(t); }
  }, [feedback]);

  const showFeedback = (type: "success" | "error", message: string) => setFeedback({ type, message });

  const filteredAppointments = useMemo(() => data.appointments.filter(apt => 
    (filters.status === "all" || apt.status === filters.status) &&
    (filters.doctor === "all" || apt.doctor_id === filters.doctor)
  ), [data.appointments, filters]);

  const stats = useMemo(() => {
    const now = new Date().getTime();
    return {
      total: data.appointments.length,
      scheduled: data.appointments.filter(a => a.status === "scheduled").length,
      completed: data.appointments.filter(a => a.status === "completed").length,
      cancelled: data.appointments.filter(a => a.status === "cancelled").length,
      upcoming: data.appointments.filter(a => a.status === "scheduled" && (new Date(a.scheduled_at).getTime() - now) / 60000 > 0 && (new Date(a.scheduled_at).getTime() - now) / 60000 < 60).length,
      avgWait: Math.round(data.appointments.reduce((acc, a) => acc + (a.duration_minutes || 0), 0) / Math.max(data.appointments.length, 1))
    };
  }, [data.appointments]);

  const handleAction = async (action: () => Promise<any>, successMsg: string, loadingState: "creating" | "updating") => {
    setUi(prev => ({ ...prev, [loadingState]: true }));
    try {
      await action();
      showFeedback("success", successMsg);
    } catch (err: any) {
      showFeedback("error", err.message || "Error en la operación");
    } finally {
      setUi(prev => ({ ...prev, [loadingState]: false }));
    }
  };

  const createAppointment = (e: FormEvent) => {
    e.preventDefault();
    if (!window.confirm("¿Crear esta cita?")) return;
    handleAction(async () => {
      const newApt = await trainityApi.createAppointment(createForm);
      setData(prev => ({ ...prev, appointments: [...prev.appointments, newApt] }));
      setCreateForm(INITIAL_FORM);
      setUi(prev => ({ ...prev, showForm: false }));
    }, "Cita creada correctamente", "creating");
  };

  const updateAppointmentStatus = (id: number, status: Appointment["status"]) => {
    if (!window.confirm(`¿Marcar cita como ${STATUS_CONFIG[status].label.toLowerCase()}?`)) return;
    handleAction(async () => {
      await trainityApi.updateAppointment(id, { status });
      setData(prev => ({ ...prev, appointments: prev.appointments.map(a => a.id === id ? { ...a, status } : a) }));
    }, `Cita ${STATUS_CONFIG[status].label.toLowerCase()}`, "updating");
  };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    handleAction(async () => {
      const updated = await trainityApi.updateAppointment(editingId, editForm);
      setData(prev => ({ ...prev, appointments: prev.appointments.map(a => a.id === editingId ? updated : a) }));
      setEditingId(null);
    }, "Cita actualizada", "updating");
  };

  const exportCSV = () => {
    const csv = [
      ["Paciente", "Doctor", "Fecha", "Hora", "Tipo", "Estado", "Consultorio"],
      ...filteredAppointments.map(apt => [
        data.patients.find(p => p.id === apt.patient_id)?.full_name || "N/A",
        data.doctors.find(d => d.id === apt.doctor_id)?.full_name || "N/A",
        new Date(apt.scheduled_at).toLocaleDateString("es-AR"),
        new Date(apt.scheduled_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        TYPE_CONFIG[apt.appointment_type].label,
        STATUS_CONFIG[apt.status].label,
        apt.room || "N/A"
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(csv);
    a.download = `citas_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showFeedback("success", "Exportado a CSV");
  };

  if (ui.loading) return <div className="p-10 text-center text-slate-500">Cargando plataforma...</div>;

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Citas Médicas</h1>
          <p className="text-slate-500 mt-1">Gestión integral de agenda y pacientes</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setUi(prev => ({ ...prev, showForm: !prev.showForm }))} className="btn-primary">
            <Plus className="w-4 h-4" /> Nueva Cita
          </button>
          <button onClick={exportCSV} className="btn-secondary">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {stats.upcoming > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800 text-sm font-medium">Hay {stats.upcoming} cita(s) programada(s) para la próxima hora.</p>
        </div>
      )}

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <span className="text-sm font-medium">{feedback.message}</span>
          <button onClick={() => setFeedback(null)}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
        </div>
      )}

      {/* Formulario */}
      {ui.showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg shadow-slate-200/40">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Programar Nueva Cita</h2>
          <form onSubmit={createAppointment} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <SelectField label="Paciente" value={createForm.patient_id} onChange={(v: string) => setCreateForm({ ...createForm, patient_id: Number(v) })} options={data.patients.map(p => ({ id: p.id, label: p.full_name }))} />
              <SelectField label="Doctor" value={createForm.doctor_id} onChange={(v: string) => setCreateForm({ ...createForm, doctor_id: Number(v) })} options={data.doctors.map(d => ({ id: d.id, label: d.full_name }))} />
              <SelectField label="Tipo" value={createForm.appointment_type} onChange={(v: string) => setCreateForm({ ...createForm, appointment_type: v as any })} options={Object.entries(TYPE_CONFIG).map(([k, v]) => ({ id: k, label: v.label }))} />
              <InputField label="Fecha y Hora" type="datetime-local" value={createForm.scheduled_at} onChange={(v: string) => setCreateForm({ ...createForm, scheduled_at: v })} />
              <InputField label="Duración (min)" type="number" value={createForm.duration_minutes} onChange={(v: string) => setCreateForm({ ...createForm, duration_minutes: Number(v) })} />
              <InputField label="Consultorio" value={createForm.room || ""} onChange={(v: string) => setCreateForm({ ...createForm, room: v })} placeholder="Ej. Sala 101" />
            </div>
            <InputField label="Notas" type="textarea" value={createForm.notes || ""} onChange={(v: string) => setCreateForm({ ...createForm, notes: v })} />
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={ui.creating} className="btn-primary">{ui.creating ? "Guardando..." : "Confirmar Cita"}</button>
              <button type="button" onClick={() => setUi(prev => ({ ...prev, showForm: false }))} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Citas" value={stats.total} icon={<Calendar className="w-5 h-5" />} color="bg-slate-100 text-slate-600" />
        <StatsCard title="Programadas" value={stats.scheduled} icon={<Clock className="w-5 h-5" />} color="bg-blue-100 text-blue-600" />
        <StatsCard title="Completadas" value={stats.completed} icon={<CheckCircle2 className="w-5 h-5" />} color="bg-emerald-100 text-emerald-600" />
        <StatsCard title="Promedio Consulta" value={`${stats.avgWait}m`} icon={<Users className="w-5 h-5" />} color="bg-indigo-100 text-indigo-600" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 mr-4"><Filter className="w-4 h-4" /><span className="text-sm font-medium">Filtros</span></div>
        <SelectField value={filters.status} onChange={(v: string) => setFilters({ ...filters, status: v as any })} options={[{id: 'all', label: 'Todos los estados'}, ...Object.entries(STATUS_CONFIG).map(([k,v]) => ({id: k, label: v.label}))]} hideLabel />
        <SelectField value={filters.doctor} onChange={(v: string) => setFilters({ ...filters, doctor: v === 'all' ? 'all' : Number(v) })} options={[{id: 'all', label: 'Todos los doctores'}, ...data.doctors.map(d => ({id: d.id, label: d.full_name}))]} hideLabel />
      </div>

      {/* Lista de Citas */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-slate-900">No hay citas registradas</p>
            <p className="text-sm">Ajusta los filtros o crea una nueva cita.</p>
          </div>
        ) : filteredAppointments.map(apt => {
          const isEditing = editingId === apt.id;
          const patient = data.patients.find(p => p.id === apt.patient_id);
          const doctor = data.doctors.find(d => d.id === apt.doctor_id);
          const aptTime = new Date(apt.scheduled_at);

          if (isEditing) return (
            <div key={apt.id} className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-inner">
              <form onSubmit={saveEdit} className="flex flex-col md:flex-row gap-4 items-end">
                <SelectField label="Estado" value={editForm.status || apt.status} onChange={(v: string) => setEditForm({ ...editForm, status: v as any })} options={Object.entries(STATUS_CONFIG).map(([k,v]) => ({id:k, label: v.label}))} />
                <InputField label="Consultorio" value={editForm.room ?? (apt.room || "")} onChange={(v: string) => setEditForm({ ...editForm, room: v })} />
                <InputField label="Notas" value={editForm.notes ?? (apt.notes || "")} onChange={(v: string) => setEditForm({ ...editForm, notes: v })} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary py-2">{ui.updating ? "..." : "Guardar"}</button>
                  <button type="button" onClick={() => setEditingId(null)} className="btn-secondary py-2">Cancelar</button>
                </div>
              </form>
            </div>
          );

          return (
            <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold border border-slate-200">
                    {patient?.full_name.charAt(0) || "?"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 truncate">{patient?.full_name || "Desconocido"}</h4>
                    <p className="text-sm text-slate-500 truncate">Dr. {doctor?.full_name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-3">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {aptTime.toLocaleDateString("es-AR")}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {aptTime.toLocaleTimeString("es-AR", {hour: '2-digit', minute:'2-digit'})} ({apt.duration_minutes}m)</span>
                  {apt.room && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {apt.room}</span>}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Badge config={TYPE_CONFIG[apt.appointment_type]} isType />
                  <Badge config={STATUS_CONFIG[apt.status]} />
                </div>
                <div className="flex gap-2">
                  {apt.status === "scheduled" && <button onClick={() => updateAppointmentStatus(apt.id, "completed")} className="action-btn text-emerald-600 bg-emerald-50 hover:bg-emerald-100"><CheckCircle2 className="w-4 h-4" /></button>}
                  <button onClick={() => { setEditingId(apt.id); setEditForm({ status: apt.status, notes: apt.notes ?? undefined, room: apt.room ?? undefined }); }} className="action-btn text-blue-600 bg-blue-50 hover:bg-blue-100"><Edit2 className="w-4 h-4" /></button>
                  {apt.status !== "cancelled" && <button onClick={() => updateAppointmentStatus(apt.id, "cancelled")} className="action-btn text-red-600 bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clases globales simplificadas (puedes pasarlas a tu archivo CSS principal si prefieres) */}
      <style>{`
        .input-base { width: 100%; border-radius: 0.5rem; border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #0f172a; outline: none; transition: all 0.2s; }
        .input-base:focus { background-color: #fff; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
        .label-base { display: block; font-size: 0.875rem; font-weight: 500; color: #475569; margin-bottom: 0.375rem; }
        .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; border-radius: 0.5rem; background-color: #4f46e5; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: #fff; transition: background-color 0.2s; }
        .btn-primary:hover:not(:disabled) { background-color: #4338ca; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { display: inline-flex; align-items: center; gap: 0.5rem; border-radius: 0.5rem; background-color: #fff; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: #475569; transition: all 0.2s; }
        .btn-secondary:hover { background-color: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        .action-btn { padding: 0.375rem; border-radius: 0.375rem; transition: background-color 0.2s; }
      `}</style>
    </div>
  );
}

// --- Componentes Auxiliares de Formulario ---
const InputField = ({ label, type = "text", value, onChange, placeholder }: any) => (
  <div className="w-full">
    {label && <label className="label-base">{label}</label>}
    {type === "textarea" ? 
      <textarea className="input-base min-h-[80px]" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /> : 
      <input type={type} className="input-base" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={type !== 'text'} />
    }
  </div>
);

const SelectField = ({ label, value, onChange, options, hideLabel }: any) => (
  <div className="w-full relative">
    {!hideLabel && <label className="label-base">{label}</label>}
    <select className="input-base appearance-none pr-8" value={value} onChange={e => onChange(e.target.value)} required>
      {!hideLabel && <option value="" disabled>Seleccionar...</option>}
      {options.map((opt: any) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
    </select>
    <ChevronDown className={`w-4 h-4 text-slate-400 absolute right-2.5 ${hideLabel ? 'top-1/2 -translate-y-1/2' : 'bottom-2.5'} pointer-events-none`} />
  </div>
);