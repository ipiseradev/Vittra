import { useMemo, useState, type ComponentType } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Receipt,
  Settings,
  Stethoscope,
  Users,
  Wallet,
  X,
} from "lucide-react";
import clsx from "clsx";

import { ClinicalAssistantDock } from "../components/ClinicalAssistantDock";
import { storage } from "../lib/storage";
import { getRoleLabel, getSessionUser } from "../lib/session";

type NavItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  path: string;
  demo?: boolean;
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Vista general",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Users, label: "Pacientes", path: "/patients" },
      { icon: CalendarDays, label: "Citas", path: "/appointments" },
    ],
  },
  {
    title: "Atencion clinica",
    items: [
      {
        icon: FileText,
        label: "Registros medicos",
        path: "/medical-records",
        demo: true,
      },
      {
        icon: Pill,
        label: "Prescripciones",
        path: "/prescriptions",
        demo: true,
      },
      { icon: Activity, label: "Asistencia", path: "/attendance", demo: true },
    ],
  },
  {
    title: "Operacion",
    items: [
      { icon: Receipt, label: "Facturacion", path: "/billing", demo: true },
      { icon: Wallet, label: "Pagos", path: "/payments", demo: true },
      { icon: BookOpen, label: "Reservas", path: "/reservations" },
      { icon: CreditCard, label: "Sesiones", path: "/sessions" },
      { icon: Settings, label: "Configuracion", path: "/settings", demo: true },
    ],
  },
];

export function ClinicLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(() => getSessionUser(), []);

  const handleLogout = () => {
    storage.clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition md:hidden",
          sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-[290px] border-r border-white/10 bg-[#0f2233] px-5 py-5 text-white shadow-[0_30px_80px_-20px_rgba(15,34,51,0.6)] transition-transform duration-300 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-400 text-lg font-bold text-slate-950">
                V
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-200/80">
                  Vittra
                </p>
                <h1 className="text-lg font-semibold">Clinic Workspace</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-2xl p-2 text-slate-300 transition hover:bg-white/10 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="surface-muted mb-6 border border-white/10 bg-white/5 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold">
                {user.initials}
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-slate-300">{getRoleLabel(user.role)}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100/55">
                  {group.title}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          clsx(
                            "flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium transition",
                            isActive
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-200 hover:bg-white/10 hover:text-white"
                          )
                        }
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4.5 w-4.5" />
                          {item.label}
                        </span>
                        {item.demo ? (
                          <span
                            className={clsx(
                              "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                              location.pathname === item.path
                                ? "bg-slate-100 text-slate-600"
                                : "bg-white/10 text-sky-100/80"
                            )}
                          >
                            Demo
                          </span>
                        ) : null}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost w-full justify-start text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-[290px]">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/70 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="btn-secondary h-11 w-11 px-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Clinica conectada
                </p>
                <h2 className="text-lg font-semibold text-slate-950">
                  Flujo clinico, operativo y financiero en una sola consola
                </h2>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="pill bg-teal-50 text-teal-700">
                <Stethoscope className="mr-2 h-3.5 w-3.5" />
                Clinica operativa
              </span>
              <span className="pill bg-slate-100 text-slate-700">{user.name}</span>
            </div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>

        <ClinicalAssistantDock />
      </div>
    </div>
  );
}
