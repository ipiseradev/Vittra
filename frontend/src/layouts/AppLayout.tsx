import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Settings,
  Stethoscope,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
  { label: "Pacientes", to: "/clients", icon: Users },
  { label: "Agenda", to: "/sessions", icon: CalendarDays },
  { label: "Atención clínica", to: "/reservations", icon: FileText },
];

const secondaryItems = [
  { label: "Configuración", to: "/settings", icon: Settings },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f5f3] text-neutral-950">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-neutral-200 bg-[#f7f7f5] lg:flex lg:flex-col">
        <div className="px-5 pb-5 pt-6">
          <div className="rounded-[24px] border border-neutral-200 bg-white px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Stethoscope size={18} />
              </div>

              <div>
                <p className="text-xl font-black tracking-tight text-neutral-950">
                  Train<span className="text-neutral-400">ity</span>
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Clinical workspace
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between px-4 pb-5">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Principal
              </p>

              <nav className="mt-3 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        [
                          "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                          isActive
                            ? "bg-neutral-950 text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                            : "text-neutral-600 hover:bg-white hover:text-neutral-950 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]",
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                              isActive
                                ? "bg-white/10 text-white"
                                : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-950 group-hover:text-white",
                            ].join(" ")}
                          >
                            <Icon size={18} />
                          </div>

                          <span className="tracking-tight">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Sistema
              </p>

              <nav className="mt-3 space-y-1.5">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                          isActive
                            ? "bg-neutral-950 text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                            : "text-neutral-600 hover:bg-white hover:text-neutral-950 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]",
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                              isActive
                                ? "bg-white/10 text-white"
                                : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-950 group-hover:text-white",
                            ].join(" ")}
                          >
                            <Icon size={18} />
                          </div>

                          <span className="tracking-tight">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-neutral-200 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-black text-neutral-900">
              Centro clínico activo
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
              Supervisá pacientes, agenda y flujo operativo desde un solo lugar.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* Header - Mobile */}
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              <Stethoscope size={16} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-neutral-950">
                
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Software de atención clínica Vittra
              </p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10 2xl:px-12">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}