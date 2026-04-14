import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Sparkles,
  Stethoscope,
  UserPlus,
  FileText,
  Pill,
  CalendarPlus,
  MoreHorizontal,
  Clock3,
  AlertCircle,
  ChevronRight,
  TimerReset,
} from 'lucide-react';

const theme = {
  shell:
    'min-h-screen bg-[#f5f5f3] text-neutral-950 font-sans selection:bg-neutral-200 p-4 lg:p-6',
  card:
    'bg-white border border-neutral-200 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
  gridCompact: 'grid grid-cols-1 gap-4 xl:grid-cols-12',
};

type CompactStatProps = {
  label: string;
  value: string;
  icon: React.ReactElement;
};

function CompactStat({ label, value, icon }: CompactStatProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3 transition-all hover:bg-neutral-50">
      <div className="rounded-xl bg-neutral-100 p-2.5 text-neutral-700">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
          {label}
        </p>
        <p className="mt-1 text-lg font-black leading-none text-neutral-950">
          {value}
        </p>
      </div>
    </div>
  );
}

type QuickActionProps = {
  label: string;
  icon: React.ReactElement;
  helper: string;
};

function QuickAction({ label, icon, helper }: QuickActionProps) {
  return (
    <button className="group flex flex-col items-center justify-center rounded-[20px] border border-neutral-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
      <div className="mb-3 rounded-2xl bg-neutral-950 p-3 text-white transition-transform duration-300 group-hover:scale-105">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <span className="text-xs font-bold tracking-tight text-neutral-800">{label}</span>
      <span className="mt-1 text-[10px] font-medium text-neutral-400">{helper}</span>
    </button>
  );
}

type AppointmentProps = {
  name: string;
  time: string;
  spec: string;
  status: 'Confirmado' | 'Espera';
};

function AppointmentRow({ name, time, spec, status }: AppointmentProps) {
  const dot = status === 'Confirmado' ? 'bg-neutral-900' : 'bg-neutral-400';

  return (
    <div className="flex items-center justify-between rounded-2xl border border-transparent bg-neutral-50 p-3 transition-all hover:border-neutral-200 hover:bg-white">
      <div className="flex items-center gap-3">
        <div className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <div>
          <p className="text-xs font-black text-neutral-950">{name}</p>
          <p className="text-[10px] font-medium text-neutral-500">{spec}</p>
        </div>
      </div>
      <p className="text-xs font-bold text-neutral-900">{time}</p>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        strong
          ? 'border-white/15 bg-white text-neutral-950'
          : 'border-white/10 bg-white/5 text-white'
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
          strong ? 'text-neutral-500' : 'text-neutral-400'
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-black md:text-base">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'Hoy' | 'Semana'>('Hoy');

  const chartData =
    activeTab === 'Hoy'
      ? [30, 42, 58, 86, 67, 40, 52, 78, 92, 61, 38, 28]
      : [55, 48, 72, 64, 80, 58, 70, 76, 68, 74, 62, 59];

  return (
    <div className={theme.shell}>
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col justify-between gap-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.03)] md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              <Stethoscope size={19} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-neutral-950">
                <span className="text-neutral-500">Vittra</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Software de atención clínica
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 md:max-w-2xl">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5">
              <Search size={16} className="text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar paciente, turno o estudio..."
                className="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
              />
            </div>

            <button className="relative rounded-xl p-2.5 text-neutral-500 transition hover:bg-neutral-100">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-neutral-900" />
            </button>

            <button className="flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800">
              <Plus size={16} />
              <span className="hidden sm:inline">Nuevo Turno</span>
            </button>
          </div>
        </header>

        <main className={theme.gridCompact}>
          <div className="space-y-4 xl:col-span-8">
            <section className="relative overflow-hidden rounded-[28px] bg-[#0d0d0d] p-5 text-white md:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_28%)]" />

              <div className="relative z-10">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-300">
                      <Sparkles size={12} />
                      Resumen operativo
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-neutral-300">
                      <TimerReset size={13} />
                      Última actualización 09:12
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                        Agenda de hoy
                      </p>
                      <h2 className="mt-2 text-3xl font-black leading-[1.05] tracking-tight md:text-4xl">
                        28 pacientes programados
                      </h2>
                      <p className="mt-3 text-sm font-medium text-neutral-400">
                        4 pacientes en espera. El próximo turno comienza a las 09:30 hs.
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                        Atención requerida
                      </p>

                      <div className="mt-3 space-y-2.5">
                        <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                          <div>
                            <p className="text-sm font-bold text-white">
                              Pacientes en recepción
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                              2 llevan más de 15 minutos esperando
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-950">
                            Alta
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                          <div>
                            <p className="text-sm font-bold text-white">
                              Próximo turno
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                              María González · Cardiología · 09:30 hs
                            </p>
                          </div>
                          <ChevronRight size={16} className="mt-0.5 text-neutral-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <HeroMetric label="En espera" value="4 pacientes" strong />
                    <HeroMetric label="Confirmados" value="87%" />
                    <HeroMetric label="Tiempo medio" value="22 min" />
                    <HeroMetric label="Alertas" value="2 activas" />
                  </div>
                </div>
              </div>
            </section>

            <section className={`${theme.card} p-6`}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-neutral-950">Actividad</h3>
                  <p className="text-xs font-medium text-neutral-500">
                    Carga horaria real
                  </p>
                </div>

                <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
                  <button
                    onClick={() => setActiveTab('Hoy')}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                      activeTab === 'Hoy'
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-400'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setActiveTab('Semana')}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                      activeTab === 'Semana'
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-400'
                    }`}
                  >
                    Semana
                  </button>
                </div>
              </div>

              <div className="mb-6 grid h-52 grid-cols-12 items-end gap-2">
                {chartData.map((value, i) => (
                  <div
                    key={i}
                    className="group relative rounded-t-[12px] bg-neutral-200 transition-all hover:bg-neutral-900"
                    style={{ height: `${value}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-neutral-950 px-2 py-1 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {value}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 md:grid-cols-4">
                <CompactStat label="Tiempo medio" value="22m" icon={<Clock3 />} />
                <CompactStat label="Evoluciones" value="14/28" icon={<FileText />} />
                <CompactStat label="Nuevos" value="6" icon={<UserPlus />} />
                <CompactStat label="Cancelados" value="2" icon={<AlertCircle />} />
              </div>
            </section>
          </div>

          <aside className="space-y-4 xl:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              <QuickAction label="Paciente" helper="Alta clínica" icon={<UserPlus />} />
              <QuickAction label="Receta" helper="Nueva emisión" icon={<Pill />} />
              <QuickAction label="Estudio" helper="Orden médica" icon={<FileText />} />
              <QuickAction label="Agenda" helper="Gestionar turnos" icon={<CalendarPlus />} />
            </div>

            <section className={`${theme.card} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-neutral-950">Próximos turnos</h3>
                  <p className="text-xs font-medium text-neutral-500">
                    Seguimiento inmediato
                  </p>
                </div>
                <button className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <AppointmentRow
                  name="María González"
                  time="09:30"
                  spec="Cardiología"
                  status="Confirmado"
                />
                <AppointmentRow
                  name="Juan Pérez"
                  time="10:15"
                  spec="Clínica médica"
                  status="Espera"
                />
                <AppointmentRow
                  name="Ana Luz"
                  time="11:00"
                  spec="Pediatría"
                  status="Confirmado"
                />
              </div>

              <button className="mt-4 w-full border-t border-neutral-100 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 transition hover:text-neutral-900">
                Ver agenda completa
              </button>
            </section>

            <section className="flex gap-3 rounded-[20px] border border-neutral-200 bg-neutral-100 p-4">
              <AlertCircle size={20} className="shrink-0 text-neutral-700" />
              <p className="text-xs leading-relaxed text-neutral-700">
                <span className="font-bold text-neutral-950">Alerta:</span> hay 2 pacientes
                esperando hace más de 15 minutos en recepción.
              </p>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}