import React, { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  FileText,
  Pill,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Building,
  CreditCard,
  BookOpen,
  Video,
} from 'lucide-react'
import { storage } from '../lib/storage'
import clsx from 'clsx'

const clinicNavGroups = [
  {
    title: 'Gestión Clínica',
    items: [
      { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Pacientes', path: '/patients' },
      { icon: Calendar, label: 'Citas', path: '/appointments' },
      { icon: FileText, label: 'Registros Médicos', path: '/medical-records' },
      { icon: Pill, label: 'Prescripciones', path: '/prescriptions' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { icon: DollarSign, label: 'Facturación', path: '/billing' },
      { icon: CreditCard, label: 'Pagos', path: '/payments' },
      { icon: Building, label: 'Clientes', path: '/clients' },
      { icon: Clock, label: 'Asistencia', path: '/attendance' },
    ],
  },
  {
    title: 'Extras',
    items: [
      { icon: BookOpen, label: 'Reservaciones', path: '/reservations' },
      { icon: Video, label: 'Sesiones', path: '/sessions' },
      { icon: Settings, label: 'Configuración', path: '/settings' },
    ],
  },
]

export function ClinicLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    storage.clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full bg-blue-900 text-white transition-all duration-300 shadow-lg',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        <div className="p-6">
          {/* Branding */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center font-bold">
              SA
            </div>
            <h1 className="text-xl font-bold">SaludAR</h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-6">
            {clinicNavGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs uppercase text-blue-200 mb-2 tracking-wide">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                          isActive
                            ? 'bg-blue-400 text-white'
                            : 'text-blue-100 hover:bg-blue-800'
                        )}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-blue-100 hover:bg-blue-800 w-full transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={clsx('transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-0')}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 focus:outline-none"
              >
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Dr. John Smith</p>
                  <p className="text-sm text-gray-600">Clinic Admin</p>
                </div>
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold">
                  JS
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Perfil
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Configuración
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
