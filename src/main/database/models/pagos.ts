import db from '../index'
import { Prestamo } from './prestamos'

export interface PagoData {
  id?: number
  prestamo_id: number
  fecha_pago: string
  monto: number
  prestamo?: Prestamo
}

export class Pago {
  id?: number
  prestamo_id: number
  fecha_pago: string
  monto: number
  prestamo?: Prestamo

  constructor(pago: PagoData) {
    this.id = pago.id
    this.prestamo_id = pago.prestamo_id
    this.fecha_pago = pago.fecha_pago
    this.monto = pago.monto
    this.prestamo = pago.prestamo

    // Validaciones básicas
    if (!pago.prestamo_id) {
      throw new Error('El préstamo es requerido')
    }

    if (!pago.fecha_pago) {
      throw new Error('La fecha de pago es requerida')
    }

    if (pago.monto <= 0) {
      throw new Error('El monto debe ser mayor a cero')
    }
  }

  static obtenerTodos(usuarioId: number): Pago[] {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        pr.fecha_prestamo,
        pr.cliente_id,
        pr.monto as prestamo_monto,
        pr.cantidad_cuotas,
        pr.interes,
        pr.intervalo_pago,
        pr.estado
      FROM pagos p
      JOIN prestamos pr ON p.prestamo_id = pr.id
      JOIN clientes c ON pr.cliente_id = c.id
      WHERE c.usuario_id = ?
      ORDER BY p.fecha_pago DESC
    `)

    const results = stmt.all(usuarioId)
    return results.map((r: any) => {
      const pago = new Pago(r)
      pago.prestamo = new Prestamo({
        id: r.prestamo_id,
        fecha_prestamo: r.fecha_prestamo,
        cliente_id: r.cliente_id,
        monto: r.prestamo_monto,
        cantidad_cuotas: r.cantidad_cuotas,
        interes: r.interes,
        intervalo_pago: r.intervalo_pago,
        estado: r.estado
      })
      return pago
    })
  }

  static obtenerPorPrestamo(prestamoId: number): Pago[] {
    const stmt = db.prepare(`
      SELECT * FROM pagos
      WHERE prestamo_id = ?
      ORDER BY fecha_pago DESC
    `)

    const results = stmt.all(prestamoId)
    return results.map((r: any) => new Pago(r))
  }

  static obtenerPorId(id: number): Pago | null {
    const stmt = db.prepare(`
      SELECT p.*, pr.cliente_id, c.usuario_id
      FROM pagos p
      JOIN prestamos pr ON p.prestamo_id = pr.id
      JOIN clientes c ON pr.cliente_id = c.id
      WHERE p.id = ?
    `)

    const result = stmt.get(id)
    if (!result) return null

    return new Pago(result)
  }

  static crear(pago: Omit<PagoData, 'id'>): Pago {
    const stmt = db.prepare(`
      INSERT INTO pagos (
        prestamo_id, fecha_pago, monto
      ) VALUES (?, ?, ?)
    `)

    const result = stmt.run(
      pago.prestamo_id,
      pago.fecha_pago,
      pago.monto
    )

    return new Pago({
      id: result.lastInsertRowid as number,
      ...pago
    })
  }

  static actualizar(pago: PagoData): boolean {
    if (!pago.id) {
      throw new Error('ID de pago requerido para actualizar')
    }

    const stmt = db.prepare(`
      UPDATE pagos
      SET prestamo_id = ?,
          fecha_pago = ?,
          monto = ?
      WHERE id = ?
    `)

    const result = stmt.run(
      pago.prestamo_id,
      pago.fecha_pago,
      pago.monto,
      pago.id
    )

    return result.changes > 0
  }

  static eliminar(id: number): boolean {
    const stmt = db.prepare(`
      DELETE FROM pagos
      WHERE id = ?
    `)

    const result = stmt.run(id)
    return result.changes > 0
  }
} 