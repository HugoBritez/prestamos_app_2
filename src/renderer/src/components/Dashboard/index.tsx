import { useEffect, useState } from 'react'
import type { Prestamo } from '../../types/Prestamo'
import type { Pago } from '../../types/Pago'
import type { Cliente } from '../../types/Cliente'
import { ResumenMetricas } from './ResumenMetricas'
import { CalendarioPagos } from './CalendarioPagos'
import { PagosPendientes } from './PagosPendientes'
import { PagosVencidos } from './PagosVencidos'
import { ClientesDestacados } from './ClientesDestacados'
import { GraficosEstadisticas } from './GraficosEstadisticas'
import { ReportePrestamos } from '../Reportes/ReportePrestamos'

export function Dashboard() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

const cargarDatos = async () => {
  try {
    setCargando(true)

    // Cargar todos los datos necesarios
    const prestamosData = await window.api.prestamos.obtenerTodos()
    const clientesData = await window.api.clientes.obtenerTodos()

    let pagosData: Pago[] = []
    try {
      pagosData = await window.api.pagos.obtenerTodos()
    } catch (pagosError) {
      console.error('Error al cargar pagos:', pagosError)
    }

    setPrestamos(prestamosData)
    setClientes(clientesData)
    setPagos(pagosData)
  } catch (err) {
    console.error('Error al cargar datos del dashboard:', err)
    setError('No se pudieron cargar los datos del panel de control')
  } finally {
    setCargando(false)
  }
}

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={cargarDatos}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="p-2">      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
        <ResumenMetricas prestamos={prestamos} pagos={pagos} />
        <GraficosEstadisticas prestamos={prestamos} pagos={pagos} />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 mb-2">
        <CalendarioPagos prestamos={prestamos} pagos={pagos} />
        <div className="space-y-2">
          <PagosPendientes prestamos={prestamos} pagos={pagos} />
          <PagosVencidos prestamos={prestamos} pagos={pagos} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2 mb-2">
        <ReportePrestamos />
      </div>
      
      <ClientesDestacados clientes={clientes} prestamos={prestamos} pagos={pagos} />
    </div>
  )
} 