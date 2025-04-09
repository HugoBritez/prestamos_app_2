import { useMemo } from 'react'
import type { Prestamo } from '../../types/Prestamo'
import type { Pago } from '../../types/Pago'

interface PagosPendientesProps {
  prestamos: Prestamo[]
  pagos: Pago[]
}

export function PagosPendientes({ prestamos, pagos }: PagosPendientesProps) {
  const pagosPendientes = useMemo(() => {
    const hoy = new Date()
    const proximaSemana = new Date()
    proximaSemana.setDate(hoy.getDate() + 7)
    
    // Filtrar préstamos activos
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo')
    
    // Crear un mapa de pagos por préstamo para calcular saldos
    const pagosPorPrestamo = new Map<number, number>()
    pagos.forEach(pago => {
      const prestamoId = pago.prestamo_id
      const montoActual = pagosPorPrestamo.get(prestamoId) || 0
      pagosPorPrestamo.set(prestamoId, montoActual + pago.monto)
    })
    
    // Calcular fechas de próximo pago y ordenar por proximidad
    const pagosPendientes = prestamosActivos.map(prestamo => {
      // Calcular monto total a pagar
      const montoTotal = prestamo.monto + (prestamo.monto * prestamo.interes / 100)
      
      // Calcular el monto pagado
      const montoPagado = pagosPorPrestamo.get(prestamo.id!) || 0
      
      // Calcular el saldo pendiente
      const saldoPendiente = montoTotal - montoPagado
      
      // Si no queda saldo, no hay pago pendiente
      if (saldoPendiente <= 0) return null
      
      // Calcular el valor de la cuota
      const valorCuota = montoTotal / prestamo.cantidad_cuotas
      
      // Estimar cuántas cuotas se han pagado
      const cuotasPagadas = Math.floor(montoPagado / valorCuota)
      
      // Calcular la fecha del préstamo
      const fechaPrestamo = new Date(prestamo.fecha_prestamo)
      
      // Calcular la fecha del próximo pago basado en el intervalo
      const proximoPago = new Date(fechaPrestamo)
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
          proximoPago.setMonth(proximoPago.getMonth() + cuotasPagadas + 1)
          break
        default:
          diasAgregar = (cuotasPagadas + 1) * 30 // Default a mensual
      }
      
      if (diasAgregar > 0) {
        proximoPago.setDate(proximoPago.getDate() + diasAgregar)
      }
      
      return {
        prestamo,
        fechaProximoPago: proximoPago,
        montoCuota: valorCuota,
        diasRestantes: Math.ceil((proximoPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      }
    }).filter(item => 
      item !== null && 
      item!.fechaProximoPago <= proximaSemana &&
      item!.fechaProximoPago >= hoy
    ) as Array<{
      prestamo: Prestamo
      fechaProximoPago: Date
      montoCuota: number
      diasRestantes: number
    }>
    
    // Ordenar por proximidad de fecha
    return pagosPendientes.sort((a, b) => 
      a.fechaProximoPago.getTime() - b.fechaProximoPago.getTime()
    )
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
      <h3 className="text-lg font-semibold mb-4">Pagos Próximos (7 días)</h3>
      
      {pagosPendientes.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay pagos pendientes para los próximos 7 días.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuota</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagosPendientes.map((item, index) => (
                <tr key={index} className={item.diasRestantes <= 1 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.prestamo.cliente?.nombre || `Cliente #${item.prestamo.cliente_id}`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatearFecha(item.fechaProximoPago)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatearMonto(item.montoCuota)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.diasRestantes <= 1 
                        ? 'bg-red-100 text-red-800' 
                        : item.diasRestantes <= 3 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {item.diasRestantes === 0 ? 'Hoy' : 
                       item.diasRestantes === 1 ? 'Mañana' : 
                       `${item.diasRestantes} días`}
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