import React, { useState } from 'react'
import type { Cliente } from '../../types/Cliente'
import { generarReportePrestamos } from '../../services/reportePrestamos'

interface FiltrosReporte {
  fechaDesde?: string
  fechaHasta?: string
  clienteId?: number
}

// Función para obtener el rango de fechas de la semana actual
const obtenerRangoSemanaActual = () => {
  const hoy = new Date()
  const primerDiaSemana = new Date(hoy)
  const ultimoDiaSemana = new Date(hoy)
  
  // Ajustar al primer día de la semana (domingo = 0)
  primerDiaSemana.setDate(hoy.getDate() - hoy.getDay())
  // Ajustar al último día de la semana (sábado = 6)
  ultimoDiaSemana.setDate(hoy.getDate() + (6 - hoy.getDay()))
  
  return {
    fechaDesde: primerDiaSemana.toISOString().split('T')[0],
    fechaHasta: ultimoDiaSemana.toISOString().split('T')[0]
  }
}

export const ReportePrestamos: React.FC = () => {
  const [filtros, setFiltros] = useState<FiltrosReporte>(obtenerRangoSemanaActual())
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [error, setError] = useState<string | null>(null)

  // Cargar clientes al montar el componente
  React.useEffect(() => {
    const cargarClientes = async () => {
      try {
        console.log('Cargando clientes...')
        const clientesData = await window.api.clientes.obtenerTodos()
        console.log('Clientes cargados:', clientesData)
        setClientes(clientesData)
        setError(null)
      } catch (error) {
        console.error('Error al cargar clientes:', error)
        setError('Error al cargar la lista de clientes')
      }
    }
    cargarClientes()
  }, [])

  const handleGenerarReporte = async () => {
    try {
      console.log('Generando reporte con filtros:', filtros)
      setError(null)
      await generarReportePrestamos(filtros)
    } catch (error) {
      console.error('Error al generar el reporte:', error)
      setError('Error al generar el reporte. Por favor, intente nuevamente.')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Reporte de Préstamos</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Filtro de fecha desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={filtros.fechaDesde || ''}
              onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
            />
          </div>

          {/* Filtro de fecha hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={filtros.fechaHasta || ''}
              onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
            />
          </div>

          {/* Filtro de cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={filtros.clienteId || ''}
              onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value ? Number(e.target.value) : undefined })}
            >
              <option value="">Todos los clientes</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerarReporte}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  )
} 