import { Cliente } from '../main/database/models/cliente'
import { Prestamo } from '../main/database/models/prestamo'

declare global {
  interface Window {
    api: {
      clientes: {
        obtenerTodos: () => Promise<Cliente[]>
        obtenerPorId: (id: number) => Promise<Cliente | null>
        crear: (cliente: Omit<Cliente, 'id'>) => Promise<Cliente>
        actualizar: (cliente: Cliente) => Promise<boolean>
        eliminar: (id: number) => Promise<boolean>
        buscar: (termino: string) => Promise<Cliente[]>
      }
      prestamos: {
        obtenerTodos: () => Promise<Prestamo[]>
        obtenerPorId: (id: number) => Promise<Prestamo | null>
        crear: (prestamo: Omit<Prestamo, 'id'>) => Promise<Prestamo>
        actualizar: (prestamo: Prestamo) => Promise<boolean>
        eliminar: (id: number) => Promise<boolean>
        obtenerPorCliente: (clienteId: number) => Promise<Prestamo[]>
        buscar: (termino: string) => Promise<Prestamo[]>
      }
      reportes: {
        generarReportePrestamos: (filtros: {
          fechaDesde?: string
          fechaHasta?: string
          clienteId?: number
        }) => Promise<Prestamo[]>
      }
    }
  }
}

export {}
