import { Cliente } from './Cliente'

export interface Prestamo {
  id?: number
  fecha_prestamo: string
  cliente_id: number
  monto: number
  cantidad_cuotas: number
  interes: number
  intervalo_pago: string // 'diario', 'semanal', 'quincenal', 'mensual'
  estado: string // 'activo', 'pagado', 'mora', 'cancelado'
  cliente?: Cliente
}
