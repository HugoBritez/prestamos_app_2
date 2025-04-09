import { Cliente } from './Cliente'
import { Prestamo } from './Prestamo'
import { Pago } from './Pago'

export interface Usuario {
  id: number
  username: string
  password: string
  nombre: string
  rol: 'admin' | 'usuario'
  estado: 'activo' | 'inactivo'
}

declare global {
  interface Window {
    api: IpcApi
  }
}

export interface IpcApi {
  auth: {
    login: (username: string, password: string) => Promise<boolean>
    logout: () => Promise<void>
    getCurrentUser: () => Promise<Usuario | null>
    registrar: (usuario: Omit<Usuario, 'id'>) => Promise<Usuario>
  }
  usuarios: {
    obtenerTodos: () => Promise<Usuario[]>
    obtenerPorId: (id: number) => Promise<Usuario | null>
    crear: (usuario: Omit<Usuario, 'id'>) => Promise<Usuario>
    actualizar: (usuario: Usuario) => Promise<boolean>
    eliminar: (id: number) => Promise<boolean>
  }
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
  pagos: {
    obtenerTodos: () => Promise<Pago[]>
    obtenerPorId: (id: number) => Promise<Pago | null>
    crear: (pago: Omit<Pago, 'id'>) => Promise<Pago>
    actualizar: (pago: Pago) => Promise<boolean>
    eliminar: (id: number) => Promise<boolean>
    obtenerPorPrestamo: (prestamoId: number) => Promise<Pago[]>
  }
  reportes: {
    generarReportePrestamos: (filtros: {
      fechaDesde?: string
      fechaHasta?: string
      clienteId?: number
    }) => Promise<Prestamo[]>
    abrirPDF: (pdfData: string) => Promise<void>
  }
}

export {}
