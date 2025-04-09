import { contextBridge, ipcRenderer } from 'electron'
import {  authApi } from './api'

// Exponer la API
const api = {
  auth: {
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    registrar: (usuario: any) => ipcRenderer.invoke('auth:registrar', usuario)
  },
  usuarios: {
    obtenerTodos: () => ipcRenderer.invoke('usuarios:obtenerTodos'),
    obtenerPorId: (id: number) => ipcRenderer.invoke('usuarios:obtenerPorId', id),
    crear: (usuario: any) => ipcRenderer.invoke('usuarios:crear', usuario),
    actualizar: (usuario: any) => ipcRenderer.invoke('usuarios:actualizar', usuario),
    eliminar: (id: number) => ipcRenderer.invoke('usuarios:eliminar', id)
  },
  clientes: {
    obtenerTodos: () => ipcRenderer.invoke('clientes:obtenerTodos'),
    obtenerPorId: (id: number) => ipcRenderer.invoke('clientes:obtenerPorId', id),
    crear: (cliente: any) => ipcRenderer.invoke('clientes:crear', cliente),
    actualizar: (cliente: any) => ipcRenderer.invoke('clientes:actualizar', cliente),
    eliminar: (id: number) => ipcRenderer.invoke('clientes:eliminar', id),
    buscar: (termino: string) => ipcRenderer.invoke('clientes:buscar', termino)
  },
  prestamos: {
    obtenerTodos: () => ipcRenderer.invoke('prestamos:obtenerTodos'),
    obtenerPorId: (id: number) => ipcRenderer.invoke('prestamos:obtenerPorId', id),
    crear: (prestamo: any) => ipcRenderer.invoke('prestamos:crear', prestamo),
    actualizar: (prestamo: any) => ipcRenderer.invoke('prestamos:actualizar', prestamo),
    eliminar: (id: number) => ipcRenderer.invoke('prestamos:eliminar', id),
    obtenerPorCliente: (clienteId: number) => ipcRenderer.invoke('prestamos:obtenerPorCliente', clienteId),
    buscar: (termino: string) => ipcRenderer.invoke('prestamos:buscar', termino)
  },
  pagos: {
    obtenerTodos: () => ipcRenderer.invoke('pagos:obtenerTodos'),
    obtenerPorId: (id: number) => ipcRenderer.invoke('pagos:obtenerPorId', id),
    crear: (pago: any) => ipcRenderer.invoke('pagos:crear', pago),
    actualizar: (pago: any) => ipcRenderer.invoke('pagos:actualizar', pago),
    eliminar: (id: number) => ipcRenderer.invoke('pagos:eliminar', id),
    obtenerPorPrestamo: (prestamoId: number) => ipcRenderer.invoke('pagos:obtenerPorPrestamo', prestamoId)
  },
  reportes: {
    generarReportePrestamos: (filtros: any) => ipcRenderer.invoke('reportes:generarReportePrestamos', filtros),
    abrirPDF: (pdfData: string) => ipcRenderer.invoke('reportes:abrirPDF', pdfData)
  }
}

// Verificar que authApi tenga todas las funciones esperadas
console.log('authApi disponible:', authApi)
console.log('authApi.getCurrentUser:', typeof authApi.getCurrentUser)
console.log('api.auth.getCurrentUser:', typeof api.auth.getCurrentUser)

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    console.log('API expuesta correctamente a través de contextBridge')
  } catch (error) {
    console.error('Error al exponer API:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
  console.log('API asignada directamente a window')
}
