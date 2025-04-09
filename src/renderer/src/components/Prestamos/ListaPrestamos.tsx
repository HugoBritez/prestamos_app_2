import  { useEffect, useState } from 'react'
import type { Prestamo } from '../../types/Prestamo'

interface ListaPrestamosProps {
  onNuevoClick: () => void
  onVerPrestamo: (id: number) => void
  onEditarPrestamo: (id: number) => void
}

export function ListaPrestamos({
  onNuevoClick,
  onVerPrestamo,
}: ListaPrestamosProps) {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [detallesPagos, setDetallesPagos] = useState<
    Record<number, { montoPagado: number; cuotasPagadas: number; saldoPendiente: number }>
  >({})


  useEffect(() => {
    cargarPrestamos()
  }, [])

  const cargarPrestamos = async () => {
    try {
      setCargando(true)
      const data = await window.api.prestamos.obtenerTodos()
      setPrestamos(data)

      // Cargar información de pagos para cada préstamo
      const pagosInfo: Record<
        number,
        { montoPagado: number; cuotasPagadas: number; saldoPendiente: number }
      > = {}

      for (const prestamo of data) {
        if (prestamo.id) {
          // Obtener los pagos asociados al préstamo
          const pagos = await window.api.pagos.obtenerPorPrestamo(prestamo.id)
          const montoPagado = pagos.reduce((total, pago) => total + pago.monto, 0)

          // Calcular monto total del préstamo
          const montoTotal = prestamo.monto + (prestamo.monto * prestamo.interes) / 100

          // Calcular saldo pendiente
          const saldoPendiente = montoTotal - montoPagado

          // Calcular cuotas pagadas (estimación basada en el monto de cada cuota)
          const montoCuota = montoTotal / prestamo.cantidad_cuotas
          const cuotasPagadas = Math.min(
            Math.floor(montoPagado / montoCuota),
            prestamo.cantidad_cuotas
          )

          pagosInfo[prestamo.id] = {
            montoPagado,
            cuotasPagadas,
            saldoPendiente
          }
        }
      }

      setDetallesPagos(pagosInfo)
    } catch (error) {
      console.error('Error al cargar préstamos:', error)
      setError('No se pudieron cargar los préstamos')
    } finally {
      setCargando(false)
    }
  }


  const buscarPrestamos = async () => {
    if (!terminoBusqueda.trim()) {
      cargarPrestamos()
      return
    }

    try {
      setCargando(true)
      const resultados = await window.api.prestamos.buscar(terminoBusqueda)
      setPrestamos(resultados)
      setError(null)
    } catch (err) {
      console.error('Error en búsqueda:', err)
      setError('Error al buscar préstamos')
    } finally {
      setCargando(false)
    }
  }


  const formatearFecha = (fechaStr: string) => {
    // Corregir el problema de zona horaria al formatear la fecha
    // Dividimos la cadena de fecha y la reconstruimos manualmente
    // para evitar que JavaScript ajuste automáticamente por zona horaria
    try {
      // Si la fecha tiene formato YYYY-MM-DD
      if (fechaStr.includes('-')) {
        const [anio, mes, dia] = fechaStr.split('-').map(Number);
        // En JavaScript, el mes va de 0-11, por lo que restamos 1
        return `${dia}/${mes}/${anio}`;
      } 
      // Si ya está en formato DD/MM/YYYY
      else if (fechaStr.includes('/')) {
        return fechaStr;
      }
      // Fallback al método anterior
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES');
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fechaStr; // Devolver la fecha original si hay error
    }
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(monto)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Préstamos</h2>
        <button
          onClick={onNuevoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Nuevo Préstamo
        </button>
      </div>

      <div className="mb-6 flex">
        <input
          type="text"
          placeholder="Buscar por nombre de cliente o CI..."
          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:ring-blue-500"
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarPrestamos()}
        />
        <button
          onClick={buscarPrestamos}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-r-lg"
        >
          Buscar
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : prestamos.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No se encontraron préstamos</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuotas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuotas Pagadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Pendiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prestamos.map((prestamo) => (
                <tr key={prestamo.id} className="hover:bg-gray-50"
                onClick={() => onVerPrestamo(prestamo.id!)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatearFecha(prestamo.fecha_prestamo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {prestamo.cliente?.nombre || `Cliente ID: ${prestamo.cliente_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatearMonto(prestamo.monto)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {prestamo.cantidad_cuotas} ({prestamo.intervalo_pago})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {detallesPagos[prestamo.id as keyof typeof detallesPagos]?.cuotasPagadas || 0} / {prestamo.cantidad_cuotas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatearMonto(detallesPagos[prestamo.id as keyof typeof detallesPagos]?.saldoPendiente || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          prestamo.estado === 'activo'
                            ? 'bg-green-100 text-green-800'
                            : prestamo.estado === 'pagado'
                              ? 'bg-blue-100 text-blue-800'
                              : prestamo.estado === 'mora'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {prestamo.estado}
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
