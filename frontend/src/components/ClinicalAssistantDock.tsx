git commit -m "chore: initialize project with Vite + TypeScript setup"
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CalendarPlus2,
  ClipboardPlus,
  FilePlus2,
  Search,
  Sparkles,
  UserPlus2,
  Wallet,
  X,
} from "lucide-react";

import { trainityApi } from "../api/trainityApi";
import {
  formatShortDateTime,
  getAppointmentOperationalStatus,
  getOperationalStatusLabel,
  isToday,
} from "../lib/clinicalDemo";
import type { Appointment, Patient } from "../types/domain";

type CommandResult = {
  label: string;
  description: string;
  href: string;
};

const quickActions: Array<{
  label: string;
  description: string;
  href: string;
  icon: typeof UserPlus2;
}> = [
  {
    label: "Nuevo paciente",
    description: "Abre la ficha rapida y deja lista el alta administrativa.",
    href: "/patients?action=new&source=assistant",
    icon: UserPlus2,
  },
  {
    label: "Agendar turno",
    description: "Crea un turno desde agenda con el flujo listo para recepcion.",
    href: "/appointments?action=new&source=assistant",
    icon: CalendarPlus2,
  },
  {
    label: "Iniciar consulta",
    description: "Lleva al workspace clinico con el encuentro actual.",
    href: "/medical-records?action=start-consultation&source=assistant",
    icon: ClipboardPlus,
  },
  {
    label: "Crear receta",
    description: "Abre prescripciones para emitir PDF, firma y plan terapeutico.",
    href: "/prescriptions?action=new&source=assistant",
    icon: FilePlus2,
  },
  {
    label: "Cobrar consulta",
    description: "Entra directo al cierre financiero del episodio.",
    href: "/billing?action=collect&source=assistant",
    icon: Wallet,
  },
];

function interpretCommand(rawValue: string): CommandResult | null {
  const value = rawValue.toLowerCase();

  if (value.includes("paciente") && (value.includes("nuevo") || value.includes("crear"))) {
    return {
      label: "Alta de paciente",
      description: "Abriendo ficha rapida para registrar un nuevo paciente.",
      href: "/patients?action=new&source=assistant",
    };
  }

  if (value.includes("turno") || value.includes("agendar") || value.includes("agenda")) {
    return {
      label: "Agenda medica",
      description: "Abriendo la agenda con el drawer de nuevo turno listo.",
      href: "/appointments?action=new&source=assistant",
    };
  }

  if (value.includes("receta") || value.includes("prescripcion")) {
    return {
      label: "Receta digital",
      description: "Abriendo el modulo de prescripciones con foco en emision.",
      href: "/prescriptions?action=new&source=assistant",
    };
  }

  if (value.includes("diabetes")) {
    return {
      label: "Cohorte diabetes",
      description: "Mostrando pacientes y resumen clinico con foco en diabetes.",
      href: "/medical-records?focus=diabetes&source=assistant",
    };
  }

  if (
    value.includes("resumen") ||
    value.includes("historia clinica") ||
    value.includes("evolucion")
  ) {
    return {
      label: "Resumen clinico",
      description: "Abriendo Patient 360 con resumen longitudinal listo para consulta.",
      href: "/medical-records?action=summary&source=assistant",
    };
  }

  if (value.includes("cobrar") || value.includes("pago") || value.includes("factura")) {
    return {
      label: "Cierre de caja",
      description: "Abriendo facturacion para cerrar el episodio asistencial.",
      href: "/billing?action=collect&source=assistant",
    };
  }

  return null;
}

export function ClinicalAssistantDock() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [lastExecution, setLastExecution] = useState<CommandResult | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    async function loadContext() {
      const [appointmentsData, patientsData] = await Promise.all([
        trainityApi.getAppointments().catch(() => []),
        trainityApi.getPatients({ isActive: true }).catch(() => []),
      ]);

      setAppointments(appointmentsData);
      setPatients(patientsData);
    }

    void loadContext();
  }, []);

  const operationalSummary = useMemo(() => {
    const todaysAppointments = appointments.filter((appointment) =>
      isToday(appointment.scheduled_at)
    );
    const waitingCount = todaysAppointments.filter(
      (appointment) => getAppointmentOperationalStatus(appointment) === "waiting"
    ).length;
    const delayedCount = todaysAppointments.filter(
      (appointment) => getAppointmentOperationalStatus(appointment) === "delayed"
    ).length;
    const nextAppointment = [...todaysAppointments]
      .filter((appointment) => appointment.status === "scheduled")
      .sort(
        (left, right) =>
          new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime()
      )[0];

    return {
      waitingCount,
      delayedCount,
      nextAppointment,
      activePatients: patients.length,
    };
  }, [appointments, patients]);

  function executeCommand(result: CommandResult) {
    setLastExecution(result);
    setOpen(false);
    navigate(result.href);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = interpretCommand(command);

    if (!result) {
      setLastExecution({
        label: "Comando no reconocido",
        description:
          "Proba con 'crear turno', 'nuevo paciente', 'crear receta', 'mostrar diabetes' o 'cobrar consulta'.",
        href: "/dashboard",
      });
      return;
    }

    executeCommand(result);
    setCommand("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_70px_-25px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-slate-900"
      >
        <Bot className="h-4 w-4" />
        IA operativa
      </button>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed bottom-0 right-0 z-50 flex h-[92vh] w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-[0_30px_100px_-30px_rgba(15,23,42,0.55)] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
                Vittra AI command center
              </p>
              <h2 className="mt-2 text-2xl font-semibold">IA visible y accionable</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Ejecuta acciones reales sobre agenda, consulta, receta y caja sin salir del flujo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <section className="surface-muted border border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-950">Pulso actual</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {operationalSummary.waitingCount} pacientes esperando,{" "}
                  {operationalSummary.delayedCount} turnos con retraso y{" "}
                  {operationalSummary.activePatients} pacientes activos para accionar.
                </p>
                {operationalSummary.nextAppointment ? (
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Proximo turno: {formatShortDateTime(operationalSummary.nextAppointment.scheduled_at)} ·{" "}
                    {getOperationalStatusLabel(
                      getAppointmentOperationalStatus(operationalSummary.nextAppointment)
                    )}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="section-title">Comando rapido</h3>
            <p className="section-copy">
              Ejemplos: "Agendar turno", "Nuevo paciente", "Crear receta", "Mostrar pacientes con diabetes".
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  className="input-field pl-11"
                  placeholder="Escribi una accion para Vittra IA"
                />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                Ejecutar accion
              </button>
            </form>
            {lastExecution ? (
              <div className="mt-4 rounded-[22px] border border-sky-100 bg-sky-50 px-4 py-4">
                <p className="text-sm font-semibold text-sky-900">{lastExecution.label}</p>
                <p className="mt-1 text-sm leading-6 text-sky-800">{lastExecution.description}</p>
              </div>
            ) : null}
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="section-title">Acciones sugeridas</h3>
              <Link to="/dashboard" className="btn-ghost" onClick={() => setOpen(false)}>
                Ver operacion
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() =>
                      executeCommand({
                        label: action.label,
                        description: action.description,
                        href: action.href,
                      })
                    }
                    className="flex w-full items-start justify-between gap-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-sky-200 hover:bg-sky-50/60"
                  >
                    <div className="flex gap-3">
                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{action.label}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
