import { useMemo } from 'react'
import type { Prestamo } from '../../types/Prestamo'
import type { Pago } from '../../types/Pago'
import type { Cliente } from '../../types/Cliente'

interface ClientesDestacadosProps {
  clientes: Cliente[]
  prestamos: Prestamo[]
  pagos: Pago[]
}

export function ClientesDestacados({ clientes, prestamos, pagos }: ClientesDestacadosProps) {
  const clientesInfo = useMemo(() => {
    // Crear un mapa para almacenar la información de cada cliente
    const clientesMap = new Map<number, {
      cliente: Cliente,
      deudaTotal: number,
      pagosPuntuales: number,
      pagosAtrasados: number,
      prestamosTotales: number
    }>()
    
    // Inicializar el mapa con todos los clientes
    clientes.forEach(cliente => {
      if (cliente.id) {
        clientesMap.set(cliente.id, {
          cliente,
          deudaTotal: 0,
          pagosPuntuales: 0,
          pagosAtrasados: 0,
          prestamosTotales: 0
        })
      }
    })
    
    // Calcular préstamos y deudas por cliente
    prestamos.forEach(prestamo => {
      const clienteId = prestamo.cliente_id
      const clienteInfo = clientesMap.get(clienteId)
      
      if (clienteInfo) {
        clienteInfo.prestamosTotales += 1
        
        if (prestamo.estado === 'activo' || prestamo.estado === 'mora') {
          // Calcular monto total a pagar
          const montoTotal = prestamo.monto + (prestamo.monto * prestamo.interes / 100)
          
          // Calcular pagos realizados para este préstamo
          const pagosPrestamo = pagos.filter(p => p.prestamo_id === prestamo.id)
          const montoPagado = pagosPrestamo.reduce((sum, p) => sum + p.monto, 0)
          
          // Calcular deuda pendiente
          const deudaPendiente = montoTotal - montoPagado
          clienteInfo.deudaTotal += deudaPendiente
        }
      }
    })
    
    // Extraer los clientes con mayor deuda y los clientes con más préstamos
    const clientesArray = Array.from(clientesMap.values())
    
    const clientesConDeuda = clientesArray
      .filter(c => c.deudaTotal > 0)
      .sort((a, b) => b.deudaTotal - a.deudaTotal)
      .slice(0, 5)
    
    const clientesConMasPrestamos = clientesArray
      .sort((a, b) => b.prestamosTotales - a.prestamosTotales)
      .slice(0, 5)
    
    return {
      clientesConDeuda,
      clientesConMasPrestamos
    }
  }, [clientes, prestamos, pagos])

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(monto)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Clientes con Mayor Deuda</h3>
        
        {clientesInfo.clientesConDeuda.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay clientes con deudas activas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deuda Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesInfo.clientesConDeuda.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.cliente.nombre}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {formatearMonto(item.deudaTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Clientes con Más Préstamos</h3>
        
        {clientesInfo.clientesConMasPrestamos.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay clientes con préstamos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Préstamos</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesInfo.clientesConMasPrestamos.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.cliente.nombre}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center font-medium">
                      {item.prestamosTotales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 