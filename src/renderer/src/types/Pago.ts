import { Prestamo } from './Prestamo'

export interface Pago {
  id?: number
  prestamo_id: number
  fecha_pago: string
  monto: number
  prestamo?: Prestamo
} 