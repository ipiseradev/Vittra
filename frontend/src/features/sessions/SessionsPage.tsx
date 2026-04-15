import { useEffect, useState } from 'react'
import { Video, Search, Filter, Plus, Users, Clock, Calendar, Play, X, AlertCircle } from 'lucide-react'
import { trainityApi } from '../../api/trainityApi'
import { useApi } from '../../hooks'
import { LoadingSpinner, ErrorAlert, EmptyState } from '../../components'
import type { ClassSession } from '../../types/domain'

export function SessionsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: sessions, loading, error } = useApi(() => trainityApi.getSessions())

  const filteredSessions = (sessions || []).filter(session => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.coach_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error.message} onDismiss={() => {}} />

  const upcomingSessions = filteredSessions.length
  const totalCapacity = filteredSessions.reduce((sum, s) => sum + s.capacity, 0)

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sesiones de Clase</h1>
        <p className="text-gray-600 mt-2">Gestiona todas las sesiones de clase</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-gray-600 text-sm">Total de Sesiones</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredSessions.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-gray-600 text-sm">Capacidad Total</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalCapacity}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-gray-600 text-sm">Promedio por Sesión</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {filteredSessions.length > 0 ? Math.round(totalCapacity / filteredSessions.length) : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <p className="text-gray-600 text-sm">Entrenador</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{filteredSessions.length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título o entrenador..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={18} />
            Nueva Sesión
          </button>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map(session => (
            <div
              key={session.id}
              className="rounded-lg p-5 bg-blue-50 border border-blue-200 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                      <Video className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{session.title}</h3>
                      <p className="text-sm text-gray-600">Entrenador: {session.coach_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Inicio</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(session.starts_at).toLocaleDateString('es-AR')} {new Date(session.starts_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Capacidad</p>
                      <p className="text-sm text-gray-900 mt-1">{session.capacity} lugares</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">ID</p>
                      <p className="text-sm text-gray-900 mt-1">#{session.id}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      Ver Detalles
                    </button>
                    <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors">
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={AlertCircle}
          title="Sin sesiones"
          description="Agrega tu primera sesión de clase"
          action={{ label: 'Nueva Sesión', onClick: () => {} }}
        />
      )}
    </div>
  )
}
