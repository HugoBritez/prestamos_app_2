import { ipcRenderer } from 'electron';
import type { Cliente } from '../main/database/models/cliente';
import type { Prestamo } from 'src/main/database/models/prestamos';
import type { Pago } from 'src/main/database/models/pagos';
import { Usuario } from 'src/main/database/models/usuario';

export const databaseApi = {
  Clientes: {
    obtenerTodos: (): Promise<Cliente[]> => ipcRenderer.invoke('clientes:obtenerTodos'),
    obtenerPorId: (id: number): Promise<Cliente | null> =>
      ipcRenderer.invoke('clientes:obtenerPorId', id),
    crear: (cliente: Omit<Cliente, 'id'>): Promise<Cliente> =>
      ipcRenderer.invoke('clientes:crear', cliente),
    actualizar: (cliente: Cliente): Promise<boolean> =>
      ipcRenderer.invoke('clientes:actualizar', cliente),
    eliminar: (id: number): Promise<boolean> => ipcRenderer.invoke('clientes:eliminar', id),
    buscar: (termino: string): Promise<Cliente[]> => ipcRenderer.invoke('clientes:buscar', termino)
  },

    Prestamos: {
    obtenerTodos: (): Promise<Prestamo[]> => ipcRenderer.invoke('prestamos:obtenerTodos'),
    obtenerPorId: (id: number): Promise<Prestamo | null> =>
      ipcRenderer.invoke('prestamos:obtenerPorId', id),
    crear: (prestamo: Omit<Prestamo, 'id'>): Promise<Prestamo> =>
      ipcRenderer.invoke('prestamos:crear', prestamo),
    actualizar: (prestamo: Prestamo): Promise<boolean> =>
      ipcRenderer.invoke('prestamos:actualizar', prestamo),
    eliminar: (id: number): Promise<boolean> => ipcRenderer.invoke('prestamos:eliminar', id),
    obtenerPorCliente: (clienteId: number): Promise<Prestamo[]> =>
      ipcRenderer.invoke('prestamos:obtenerPorCliente', clienteId),
    buscar: (termino: string): Promise<Prestamo[]> => ipcRenderer.invoke('prestamos:buscar', termino)
  },
  
  Pagos: {
    obtenerTodos: (): Promise<Pago[]> => ipcRenderer.invoke('pagos:obtenerTodos'),
    obtenerPorId: (id: number): Promise<Pago | null> => 
      ipcRenderer.invoke('pagos:obtenerPorId', id),
    crear: (pago: Omit<Pago, 'id'>): Promise<Pago> =>
      ipcRenderer.invoke('pagos:crear', pago),
    actualizar: (pago: Pago): Promise<boolean> =>
      ipcRenderer.invoke('pagos:actualizar', pago),
    eliminar: (id: number): Promise<boolean> => 
      ipcRenderer.invoke('pagos:eliminar', id),
    obtenerPorPrestamo: (prestamoId: number): Promise<Pago[]> =>
      ipcRenderer.invoke('pagos:obtenerPorPrestamo', prestamoId),
    registrarPago: (prestamoId: number, monto: number, fecha_pago?: string): Promise<Pago> =>
      ipcRenderer.invoke('pagos:registrarPago', prestamoId, monto, fecha_pago)
  },
  Usuarios: {
    obtenerTodos: () => ipcRenderer.invoke('usuarios:obtenerTodos'),
    obtenerPorId: (id: number) => ipcRenderer.invoke('usuarios:obtenerPorId', id),
    crear: (usuario: any) => ipcRenderer.invoke('usuarios:crear', usuario),
    actualizar: (usuario: any) => ipcRenderer.invoke('usuarios:actualizar', usuario),
    eliminar: (id: number) => ipcRenderer.invoke('usuarios:eliminar', id)
  }
}

export const authApi = {
  login: (username: string, password: string): Promise<boolean> => 
    ipcRenderer.invoke('auth:login', username, password),
  logout: (): Promise<void> => 
    ipcRenderer.invoke('auth:logout'),
  getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  registrar: (usuario: Usuario) => ipcRenderer.invoke('auth:registrar', usuario)
}

// Modificar el contexto window
declare global {
  interface Window {
    api: {
      database: typeof databaseApi
      auth: typeof authApi
    }
  }
}
