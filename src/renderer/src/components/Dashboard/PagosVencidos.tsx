import { useMemo } from 'react'
import type { Prestamo } from '../../types/Prestamo'
import type { Pago } from '../../types/Pago'

interface PagosVencidosProps {
  prestamos: Prestamo[]
  pagos: Pago[]
}

export function PagosVencidos({ prestamos, pagos }: PagosVencidosProps) {
  const pagosVencidos = useMemo(() => {
    const hoy = new Date()
    
    // Filtrar préstamos activos
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo')
    
    // Crear un mapa de pagos por préstamo para calcular saldos
    const pagosPorPrestamo = new Map<number, number>()
    pagos.forEach(pago => {
      const prestamoId = pago.prestamo_id
      const montoActual = pagosPorPrestamo.get(prestamoId) || 0
      pagosPorPrestamo.set(prestamoId, montoActual + pago.monto)
    })
    
    // Calcular fechas de pagos vencidos
    const pagosVencidos = prestamosActivos.map(prestamo => {
      // Calcular monto total a pagar
      const montoTotal = prestamo.monto + (prestamo.monto * prestamo.interes / 100)
      
      // Calcular el monto pagado
      const montoPagado = pagosPorPrestamo.get(prestamo.id!) || 0
      
      // Calcular el saldo pendiente
      const saldoPendiente = montoTotal - montoPagado
      
      // Si no queda saldo, no hay pago vencido
      if (saldoPendiente <= 0) return null
      
      // Calcular el valor de la cuota
      const valorCuota = montoTotal / prestamo.cantidad_cuotas
      
      // Estimar cuántas cuotas se han pagado
      const cuotasPagadas = Math.floor(montoPagado / valorCuota)
      
      // Calcular la fecha del préstamo
      const fechaPrestamo = new Date(prestamo.fecha_prestamo)
      
      // Calcular la fecha del último pago que debería haberse realizado
      const fechaUltimoPago = new Date(fechaPrestamo)
      let diasAgregar = 0
      
      switch (prestamo.intervalo_pago) {
        case 'diario':
          diasAgregar = cuotasPagadas + 1
          break
        case 'semanal':
          diasAgregar = (cuotasPagadas + 1) * 7
          break
        case 'quincenal':
          diasAgregar = (cuotasPagadas + 1) * 15
          break
        case 'mensual':
          fechaUltimoPago.setMonth(fechaUltimoPago.getMonth() + cuotasPagadas + 1)
          break
        default:
          diasAgregar = (cuotasPagadas + 1) * 30 // Default a mensual
      }
      
      if (diasAgregar > 0) {
        fechaUltimoPago.setDate(fechaUltimoPago.getDate() + diasAgregar)
      }
      
      // Si la fecha de pago ya pasó, está vencido
      if (fechaUltimoPago < hoy) {
        return {
          prestamo,
          fechaVencimiento: fechaUltimoPago,
          montoCuota: valorCuota,
          diasVencidos: Math.ceil((hoy.getTime() - fechaUltimoPago.getTime()) / (1000 * 60 * 60 * 24))
        }
      }
      
      return null
    }).filter(item => item !== null) as Array<{
      prestamo: Prestamo
      fechaVencimiento: Date
      montoCuota: number
      diasVencidos: number
    }>
    
    // Ordenar por cantidad de días vencidos (más vencidos primero)
    return pagosVencidos.sort((a, b) => b.diasVencidos - a.diasVencidos)
  }, [prestamos, pagos])

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(monto)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Pagos Vencidos</h3>
      
      {pagosVencidos.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay pagos vencidos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venció el</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuota</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días vencidos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagosVencidos.map((item, index) => (
                <tr key={index} className={item.diasVencidos >= 30 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.prestamo.cliente?.nombre || `Cliente #${item.prestamo.cliente_id}`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatearFecha(item.fechaVencimiento)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatearMonto(item.montoCuota)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.diasVencidos >= 30 
                        ? 'bg-red-100 text-red-800' 
                        : item.diasVencidos >= 15
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.diasVencidos} días
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 