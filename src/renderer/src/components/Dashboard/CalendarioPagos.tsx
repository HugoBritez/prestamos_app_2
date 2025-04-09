import { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import type { Prestamo } from '../../types/Prestamo'
import type { Pago } from '../../types/Pago'

interface CalendarioPagosProps {
  prestamos: Prestamo[]
  pagos: Pago[]
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export function CalendarioPagos({ prestamos, pagos }: CalendarioPagosProps) {
  const [value, onChange] = useState<Value>(new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)
  
  // Calcular fechas con pagos pendientes
  const fechasConPagos = useMemo(() => {
    const fechas = new Map<string, {
      cantidadPagos: number;
      montoTotal: number;
      prestamos: Array<{prestamo: Prestamo, montoCuota: number}>;
    }>()
    
    // Filtrar préstamos activos
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo')
    
    // Crear un mapa de pagos por préstamo para calcular saldos
    const pagosPorPrestamo = new Map<number, number>()
    pagos.forEach(pago => {
      const prestamoId = pago.prestamo_id
      const montoActual = pagosPorPrestamo.get(prestamoId) || 0
      pagosPorPrestamo.set(prestamoId, montoActual + pago.monto)
    })
    
    // Para cada préstamo, calcular fechas de pago
    prestamosActivos.forEach(prestamo => {
      // Calcular monto total a pagar
      const montoTotal = prestamo.monto + (prestamo.monto * prestamo.interes / 100)
      
      // Calcular el monto pagado
      const montoPagado = pagosPorPrestamo.get(prestamo.id!) || 0
      
      // Calcular el saldo pendiente
      const saldoPendiente = montoTotal - montoPagado
      
      // Si no queda saldo, no hay pagos pendientes
      if (saldoPendiente <= 0) return
      
      // Calcular el valor de la cuota
      const valorCuota = montoTotal / prestamo.cantidad_cuotas
      
      // Estimar cuántas cuotas se han pagado y cuántas faltan
      const cuotasPagadas = Math.floor(montoPagado / valorCuota)
      const cuotasPendientes = prestamo.cantidad_cuotas - cuotasPagadas
      
      // Calcular la fecha del préstamo
      const fechaPrestamo = new Date(prestamo.fecha_prestamo)
      
      // Calcular todas las fechas de pago pendientes
      for (let i = 0; i < cuotasPendientes; i++) {
        const fechaPago = new Date(fechaPrestamo)
        let diasAgregar = 0
        
        switch (prestamo.intervalo_pago) {
          case 'diario':
            diasAgregar = (cuotasPagadas + i + 1)
            break
          case 'semanal':
            diasAgregar = (cuotasPagadas + i + 1) * 7
            break
          case 'quincenal':
            diasAgregar = (cuotasPagadas + i + 1) * 15
            break
          case 'mensual':
            fechaPago.setMonth(fechaPago.getMonth() + (cuotasPagadas + i + 1))
            break
          default:
            diasAgregar = (cuotasPagadas + i + 1) * 30 // Default a mensual
        }
        
        if (diasAgregar > 0) {
          fechaPago.setDate(fechaPago.getDate() + diasAgregar)
        }
        
        // Formatear la fecha para usarla como clave
        const fechaKey = fechaPago.toISOString().split('T')[0]
        
        // Agregar o actualizar la información para esta fecha
        const infoExistente = fechas.get(fechaKey) || { 
          cantidadPagos: 0, 
          montoTotal: 0,
          prestamos: []
        }
        
        fechas.set(fechaKey, {
          cantidadPagos: infoExistente.cantidadPagos + 1,
          montoTotal: infoExistente.montoTotal + valorCuota,
          prestamos: [...infoExistente.prestamos, { prestamo, montoCuota: valorCuota }]
        })
      }
    })
    
    return fechas
  }, [prestamos, pagos])
  
  // Función para determinar el color de la fecha en el calendario
  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''
    
    const fechaStr = date.toISOString().split('T')[0]
    const infoPagos = fechasConPagos.get(fechaStr)
    
    if (!infoPagos) return ''
    
    // Asignar clases según la cantidad de pagos
    if (infoPagos.cantidadPagos >= 5) {
      return 'bg-red-200 text-red-800 rounded-lg'
    } else if (infoPagos.cantidadPagos >= 3) {
      return 'bg-orange-200 text-orange-800 rounded-lg'
    } else {
      return 'bg-green-200 text-green-800 rounded-lg'
    }
  }
  
  // Contenido para las fechas con pagos
  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    
    const fechaStr = date.toISOString().split('T')[0]
    const infoPagos = fechasConPagos.get(fechaStr)
    
    if (!infoPagos) return null
    
    return (
      <div className="text-xs mt-1">
        <span className="font-bold">{infoPagos.cantidadPagos}</span>
      </div>
    )
  }
  
  const handleClickDay = (value: Date) => {
    setFechaSeleccionada(value)
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
      <h3 className="text-lg font-semibold mb-4">Calendario de Pagos</h3>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <Calendar
            onChange={onChange}
            value={value}
            onClickDay={handleClickDay}
            tileClassName={getTileClassName}
            tileContent={getTileContent}
            className="w-full border-0"
          />
          <div className="mt-4 flex items-center justify-around">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-200 rounded-sm mr-2"></div>
              <span className="text-xs">1-2 pagos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-200 rounded-sm mr-2"></div>
              <span className="text-xs">3-4 pagos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-200 rounded-sm mr-2"></div>
              <span className="text-xs">5+ pagos</span>
            </div>
          </div>
        </div>
        
        <div className="lg:w-1/2">
          {fechaSeleccionada && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Pagos del {fechaSeleccionada.toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h4>
              
              {(() => {
                const fechaStr = fechaSeleccionada.toISOString().split('T')[0]
                const infoPagos = fechasConPagos.get(fechaStr)
                
                if (!infoPagos || infoPagos.cantidadPagos === 0) {
                  return (
                    <p className="text-gray-500">No hay pagos programados para esta fecha.</p>
                  )
                }
                
                return (
                  <>
                    <p className="text-gray-600 mb-3">
                      {infoPagos.cantidadPagos} {infoPagos.cantidadPagos === 1 ? 'pago' : 'pagos'} por un total de {formatearMonto(infoPagos.montoTotal)}
                    </p>
                    
                    <div className="overflow-y-auto max-h-80">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cuota
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {infoPagos.prestamos.map((item, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {item.prestamo.cliente?.nombre || `Cliente #${item.prestamo.cliente_id}`}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {formatearMonto(item.montoCuota)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
          
          {!fechaSeleccionada && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 italic">
                Selecciona una fecha en el calendario para ver los pagos programados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 