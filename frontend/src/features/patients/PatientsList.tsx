import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Eye, AlertCircle } from 'lucide-react'
import { trainityApi } from '../../api/trainityApi'
import { useApi, useMutation } from '../../hooks'
import { LoadingSpinner, ErrorAlert, EmptyState } from '../../components'
import type { Client } from '../../types/domain'

export function PatientsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const { data: patients, loading, error: loadError } = useApi(
    () => trainityApi.getClients({
      search: searchTerm || undefined,
      isActive: filterActive === 'all' ? undefined : filterActive === 'active'
    }),
    [searchTerm, filterActive]
  )

  const filteredPatients = (patients || []).filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <LoadingSpinner />
  if (loadError) return <ErrorAlert message={loadError.message} onDismiss={() => {}} />

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600 mt-2">Gestiona tu base de datos de pacientes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Nuevo Paciente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar pacientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterActive(status)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filterActive === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Inactivos'}
          </button>
        ))}
      </div>

      {/* Patients Table */}
      {filteredPatients.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Teléfono</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Creado</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{patient.full_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{patient.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{patient.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        patient.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm">{new Date(patient.created_at).toLocaleDateString('es-AR')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={AlertCircle}
          title="Sin pacientes"
          description="Agrega tu primer paciente para comenzar"
          action={{ label: 'Nuevo Paciente', onClick: () => {} }}
        />
      )}
    </div>
  )
}
