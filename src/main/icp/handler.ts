import { ipcMain } from 'electron'
import { Cliente } from '../database/models/cliente'
// Importa otros modelos cuando los tengas

export function setupIpcHandlers(): void {
  // Handlers para Clientes
  ipcMain.handle('clientes:obtenerTodos', async (): Promise<Cliente[]> => {
    try {
      return Cliente.obtenerTodos()
    } catch (error) {
      console.error('Error al obtener clientes:', error)
      throw new Error('No se pudieron cargar los clientes')
    }
  })

  ipcMain.handle('clientes:obtenerPorId', async (_, id: number): Promise<Cliente | null> => {
    try {
      return Cliente.obtenerPorId(id)
    } catch (error) {
      console.error(`Error al obtener cliente con ID ${id}:`, error)
      throw new Error(`No se pudo encontrar el cliente con ID ${id}`)
    }
  })

  ipcMain.handle('clientes:crear', async (_, clienteData: any): Promise<Cliente> => {
    try {
      // Creamos una instancia de Cliente para validar los datos
      const cliente = new Cliente(clienteData)
      // Utilizamos el método estático para crear en la BD
      return Cliente.crear(cliente)
    } catch (error) {
      console.error('Error al crear cliente:', error)
      throw error // Enviamos el error de validación al renderer
    }
  })

  ipcMain.handle('clientes:actualizar', async (_, clienteData: any): Promise<boolean> => {
    try {
      // Validamos y creamos una instancia del cliente
      const cliente = new Cliente(clienteData)
      // Actualizamos
      return cliente.actualizar()
    } catch (error) {
      console.error(`Error al actualizar cliente:`, error)
      throw error
    }
  })

  ipcMain.handle('clientes:eliminar', async (_, id: number): Promise<boolean> => {
    try {
      const cliente = Cliente.obtenerPorId(id)
      if (!cliente) {
        throw new Error(`No se encontró el cliente con ID ${id}`)
      }
      return cliente.eliminar()
    } catch (error) {
      console.error(`Error al eliminar cliente con ID ${id}:`, error)
      throw error
    }
  })

  ipcMain.handle('clientes:buscar', async (_, termino: string): Promise<Cliente[]> => {
    try {
      return Cliente.buscarCliente(termino)
    } catch (error) {
      console.error(`Error al buscar clientes con término "${termino}":`, error)
      throw new Error('Error al buscar clientes')
    }
  })

  // Aquí puedes agregar más handlers para otros modelos como Préstamos, etc.
}
