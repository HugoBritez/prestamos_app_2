import  { useEffect, useState } from 'react'
import type { Cliente } from '../../types/Cliente'

interface ListaClientesProps {
  onNuevoClick: () => void
  onVerCliente: (id: number) => void
  onEditarCliente: (id: number) => void
}

export function ListaClientes({ onNuevoClick, onVerCliente, onEditarCliente }: ListaClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [terminoBusqueda, setTerminoBusqueda] = useState('')

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    try {
      setCargando(true)
      const data = await window.api.clientes.obtenerTodos()
      setClientes(data)
      setError(null)
    } catch (err) {
      console.error('Error al cargar clientes:', err)
      setError('No se pudieron cargar los clientes')
    } finally {
      setCargando(false)
    }
  }

  const buscarClientes = async () => {
    if (!terminoBusqueda.trim()) {
      cargarClientes()
      return
    }

    try {
      setCargando(true)
      const resultados = await window.api.clientes.buscar(terminoBusqueda)
      setClientes(resultados)
      setError(null)
    } catch (err) {
      console.error('Error en búsqueda:', err)
      setError('Error al buscar clientes')
    } finally {
      setCargando(false)
    }
  }

  const eliminarCliente = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) {
      return
    }

    try {
      await window.api.clientes.eliminar(id)
      cargarClientes() // Recargar la lista
    } catch (err) {
      console.error('Error al eliminar:', err)
      setError('No se pudo eliminar el cliente')
    }
  }

  return (
    <div className="p-6">
      {/* Cabecera y botón nuevo */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
        <button
          onClick={onNuevoClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6 flex">
        <input
          type="text"
          placeholder="Buscar por nombre o CI..."
          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarClientes()}
        />
        <button
          onClick={buscarClientes}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-r-lg"
        >
          Buscar
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Tabla de clientes */}
      {cargando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{cliente.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cliente.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cliente.ci}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cliente.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${cliente.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {cliente.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onVerCliente(cliente.id!)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => onEditarCliente(cliente.id!)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarCliente(cliente.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
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
