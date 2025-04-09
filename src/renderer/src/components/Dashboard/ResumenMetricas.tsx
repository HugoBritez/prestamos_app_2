import { useMemo } from 'react'
import type { Prestamo } from '../../types/Prestamo'
import type { Pago } from '../../types/Pago'

interface ResumenMetricasProps {
  prestamos: Prestamo[]
  pagos: Pago[]
}

export function ResumenMetricas({ prestamos, pagos }: ResumenMetricasProps) {
  const metricas = useMemo(() => {
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo')
    const capitalTotal = prestamosActivos.reduce((sum, p) => sum + p.monto, 0)
    const interesTotal = prestamosActivos.reduce((sum, p) => sum + (p.monto * p.interes / 100), 0)
    const totalPorCobrar = capitalTotal + interesTotal
    
    // Calcular el total ya cobrado
    const pagoTotal = pagos.reduce((sum, p) => sum + p.monto, 0)
    
    return {
      prestamosActivos: prestamosActivos.length,
      capitalTotal,
      interesTotal,
      totalPorCobrar,
      pagoTotal
    }
  }, [prestamos, pagos])

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(monto)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Resumen Financiero</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Préstamos Activos</p>
          <p className="text-md font-bold text-blue-600">{metricas.prestamosActivos}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Capital Prestado</p>
          <p className="text-md font-bold text-green-600">{formatearMonto(metricas.capitalTotal)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Intereses Esperados</p>
          <p className="text-md font-bold text-purple-600">{formatearMonto(metricas.interesTotal)}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Por Cobrar</p>
          <p className="text-md font-bold text-orange-600">{formatearMonto(metricas.totalPorCobrar - metricas.pagoTotal)}</p>
        </div>
      </div>
    </div>
  )
} 