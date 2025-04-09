import { useState, useEffect } from 'react'
import type { Cliente } from '../../types/Cliente'
import type { Prestamo } from '../../types/Prestamo' // Asegúrate de tener este tipo definido
import { Locate } from 'lucide-react'

interface DetallesClienteProps {
  clienteId: number
  onBack: () => void
  onEdit: () => void
}

export function DetallesCliente({ clienteId, onBack, onEdit }: DetallesClienteProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]) // Nuevo estado para préstamos
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [clienteId])

  // Modificamos esta función para cargar también los préstamos
  const cargarDatos = async () => {
    try {
      setCargando(true)
      // Cargar cliente
      const data = await window.api.clientes.obtenerPorId(clienteId)
      if (data) {
        setCliente(data)

        // Cargar préstamos del cliente
        try {
          const prestamoData = await window.api.prestamos.obtenerPorCliente(clienteId)
          setPrestamos(prestamoData)
        } catch (errPrestamos) {
          console.error('Error al cargar préstamos:', errPrestamos)
          // No interrumpimos todo el flujo por un error en préstamos
        }
      } else {
        setError('No se encontró el cliente')
      }
    } catch (err) {
      console.error('Error al cargar cliente:', err)
      setError('Error al cargar los datos del cliente')
    } finally {
      setCargando(false)
    }
  }

  // Funciones de formato para los préstamos
  const formatearFecha = (fechaStr: string) => {
    // Corregir el problema de zona horaria al formatear la fecha
    try {
      // Si la fecha tiene formato YYYY-MM-DD
      if (fechaStr.includes('-')) {
        const [anio, mes, dia] = fechaStr.split('-').map(Number);
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

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error || 'No se encontró el cliente'}</p>
          <button onClick={onBack} className="mt-2 text-red-700 font-medium hover:underline">
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-bold text-gray-800">Información del Cliente</h2>
          <div className="space-x-2">
            <button
              onClick={onBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-200"
            >
              Volver
            </button>
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Editar
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Información Personal
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{cliente.nombre}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Cédula de Identidad</p>
                  <p className="font-medium">{cliente.ci}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{cliente.telefono}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{cliente.direccion || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      cliente.estado === 'activo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {cliente.estado}
                  </span>
                </div>
              </div>
            </div>

            {/* Información de Ubicación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Información de Ubicación
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Ubicación de Casa</p>
                  <a
                    href={cliente.ubicacion_casa}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button className=" text-blue-600 hover:text-blue-700  py-1 rounded-lg transition duration-200 flex items-center">
                      <Locate className="w-4 h-4 mr-2" /> Ver en Google Maps
                    </button>
                  </a>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Referencia de Casa</p>
                  <p className="font-medium">{cliente.referencia_casa || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Ubicación de Trabajo</p>
                  <a href={cliente.ubicacion_trabajo} target="_blank" rel="noopener noreferrer">
                    <button className=" text-blue-600 hover:text-blue-700  py-1 rounded-lg transition duration-200 flex items-center">
                      <Locate className="w-4 h-4 mr-2" /> Ver en Google Maps
                    </button>
                  </a>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Referencia de Trabajo</p>
                  <p className="font-medium">{cliente.referencia_trabajo || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* NUEVO: Sección de préstamos */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Préstamos del Cliente
            </h3>

            {prestamos.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-500">Este cliente no tiene préstamos registrados</p>
                <button
                  onClick={() => alert(`Crear nuevo préstamo para cliente ID: ${clienteId}`)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Crear nuevo préstamo
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto bg-white rounded-lg shadow border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cuotas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {prestamos.map((prestamo) => (
                        <tr key={prestamo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatearFecha(prestamo.fecha_prestamo)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatearMonto(prestamo.monto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {prestamo.cantidad_cuotas} ({prestamo.intervalo_pago})
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
