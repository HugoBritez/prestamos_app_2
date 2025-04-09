import  { useState, useEffect } from 'react'
import type { Cliente } from '../../types/Cliente'

interface FormularioClienteProps {
  clienteId?: number
  onSave: () => void
  onCancel: () => void
}

export function FormularioCliente({ clienteId, onSave, onCancel }: FormularioClienteProps) {
  const [cliente, setCliente] = useState<Partial<Cliente>>({
    nombre: '',
    ci: '',
    telefono: '',
    direccion: '',
    ubicacion_casa: '',
    referencia_casa: '',
    ubicacion_trabajo: '',
    referencia_trabajo: '',
    estado: 'activo'
  })

  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esEdicion = !!clienteId

  // Cargar datos del cliente si estamos en modo edición
  useEffect(() => {
    if (clienteId) {
      cargarCliente(clienteId)
    }
  }, [clienteId])

  const cargarCliente = async (id: number) => {
    try {
      setCargando(true)
      const data = await window.api.clientes.obtenerPorId(id)
      if (data) {
        setCliente(data)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCliente((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setGuardando(true)
      setError(null)

      if (esEdicion) {
        // Actualizar cliente existente
        await window.api.clientes.actualizar(cliente as Cliente)
      } else {
        // Crear nuevo cliente
        await window.api.clientes.crear(cliente as Omit<Cliente, 'id'>)
      }

      onSave()
    } catch (err: any) {
      console.error('Error al guardar cliente:', err)
      setError(err.message || 'Error al guardar el cliente')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">
          {esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={cliente.nombre || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* CI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cédula de Identidad *
              </label>
              <input
                type="text"
                name="ci"
                value={cliente.ci || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={cliente.telefono || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={cliente.direccion || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Ubicación Casa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación de Casa
              </label>
              <input
                type="text"
                name="ubicacion_casa"
                value={cliente.ubicacion_casa || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Referencia Casa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia de Casa
              </label>
              <input
                type="text"
                name="referencia_casa"
                value={cliente.referencia_casa || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Ubicación Trabajo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación de Trabajo
              </label>
              <input
                type="text"
                name="ubicacion_trabajo"
                value={cliente.ubicacion_trabajo || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Referencia Trabajo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia de Trabajo
              </label>
              <input
                type="text"
                name="referencia_trabajo"
                value={cliente.referencia_trabajo || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                name="estado"
                value={cliente.estado || 'activo'}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 ${
                guardando ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
