export interface Cliente {
  id?: number
  nombre: string
  ci: string
  telefono: string
  direccion?: string
  ubicacion_casa?: string
  referencia_casa?: string
  ubicacion_trabajo?: string
  referencia_trabajo?: string
  estado: 'activo' | 'inactivo'
}
