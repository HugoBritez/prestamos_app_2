import db from '../index'
import { Cliente } from './cliente'
import { Pago, PagoData } from './pagos'

export interface PrestamoData {
  id?: number
  fecha_prestamo: string
  cliente_id: number
  monto: number
  cantidad_cuotas: number
  interes: number
  intervalo_pago: string // 'diario', 'semanal', 'quincenal', 'mensual'
  estado: string // 'activo', 'pagado', 'mora', 'cancelado'
}

export class Prestamo {
  id?: number
  fecha_prestamo: string
  cliente_id: number
  monto: number
  cantidad_cuotas: number
  interes: number
  intervalo_pago: string
  estado: string
  cliente?: Cliente

  constructor(prestamo: PrestamoData) {
    this.id = prestamo.id
    this.fecha_prestamo = prestamo.fecha_prestamo
    this.cliente_id = prestamo.cliente_id
    this.monto = prestamo.monto
    this.cantidad_cuotas = prestamo.cantidad_cuotas
    this.interes = prestamo.interes
    this.intervalo_pago = prestamo.intervalo_pago
    this.estado = prestamo.estado

    // Validaciones básicas
    if (!prestamo.fecha_prestamo) {
      throw new Error('La fecha del préstamo es requerida')
    }

    if (!prestamo.cliente_id) {
      throw new Error('El cliente es requerido')
    }

    if (prestamo.monto <= 0) {
      throw new Error('El monto debe ser mayor a cero')
    }

    if (prestamo.cantidad_cuotas <= 0) {
      throw new Error('La cantidad de cuotas debe ser mayor a cero')
    }

    if (prestamo.interes < 0) {
      throw new Error('El interés no puede ser negativo')
    }
  }

  static obtenerTodos(usuarioId?: number): Prestamo[] {
    let query = `
      SELECT p.*, c.nombre as cliente_nombre, c.ci as cliente_ci, c.telefono as cliente_telefono, c.usuario_id
      FROM prestamos p 
      JOIN clientes c ON p.cliente_id = c.id 
    `;
    
    // Si tenemos un ID de usuario, filtramos por él
    if (usuarioId) {
      query += ` WHERE c.usuario_id = ? `;
    }
    
    query += ` ORDER BY p.fecha_prestamo DESC`;
    
    const stmt = db.prepare(query);
    
    // Ejecutamos la consulta con o sin el parámetro de usuarioId
    const results = usuarioId ? stmt.all(usuarioId) : stmt.all();

    return results.map((r: any) => {
      const prestamo = new Prestamo(r);
      if (r.cliente_nombre) {
        prestamo.cliente = new Cliente(
          {
            id: r.cliente_id,
            nombre: r.cliente_nombre,
            ci: r.cliente_ci || '',
            telefono: r.cliente_telefono || '',
            direccion: r.direccion || '',
            ubicacion_casa: r.ubicacion_casa || '',
            referencia_casa: r.referencia_casa || '',
            ubicacion_trabajo: r.ubicacion_trabajo || '',
            referencia_trabajo: r.referencia_trabajo || '',
            estado: r.estado || 'activo',
            usuario_id: r.usuario_id
          },
          { validarCompleto: false }
        ); 
      }
      return prestamo;
    });
  }

  static obtenerPorId(id: number): Prestamo | null {
    const stmt = db.prepare(`
      SELECT p.*, c.nombre as cliente_nombre, c.ci, c.telefono 
      FROM prestamos p 
      JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.id = ?
    `)
    const result = stmt.get(id)

    if (!result) return null

    const prestamo = new Prestamo(result)
    if (result.cliente_nombre) {
      prestamo.cliente = new Cliente({
        id: result.cliente_id,
        nombre: result.cliente_nombre,
        ci: result.ci,
        telefono: result.telefono,
        direccion: result.direccion,
        ubicacion_casa: result.ubicacion_casa,
        referencia_casa: result.referencia_casa,
        ubicacion_trabajo: result.ubicacion_trabajo,
        referencia_trabajo: result.referencia_trabajo,
        estado: result.estado,
        usuario_id: result.usuario_id
      }, { validarCompleto: false })
    }
    return prestamo
  }

  static crear(prestamo: Omit<Prestamo, 'id'>): Prestamo {
    const stmt = db.prepare(`
      INSERT INTO prestamos (
        fecha_prestamo, cliente_id, monto, cantidad_cuotas, 
        interes, intervalo_pago, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      prestamo.fecha_prestamo,
      prestamo.cliente_id,
      prestamo.monto,
      prestamo.cantidad_cuotas,
      prestamo.interes,
      prestamo.intervalo_pago,
      prestamo.estado
    )

    return new Prestamo({
      ...prestamo,
      id: result.lastInsertRowid as number
    })
  }

  actualizar(): boolean {
    if (!this.id) throw new Error('No se puede actualizar un préstamo sin ID')

    const stmt = db.prepare(`
      UPDATE prestamos SET 
        fecha_prestamo = ?, 
        cliente_id = ?, 
        monto = ?, 
        cantidad_cuotas = ?, 
        interes = ?, 
        intervalo_pago = ?, 
        estado = ? 
      WHERE id = ?
    `)

    const result = stmt.run(
      this.fecha_prestamo,
      this.cliente_id,
      this.monto,
      this.cantidad_cuotas,
      this.interes,
      this.intervalo_pago,
      this.estado,
      this.id
    )

    return result.changes > 0
  }

  eliminar(): boolean {
    if (!this.id) throw new Error('No se puede eliminar un préstamo sin ID')

    // Primero verificar si hay pagos asociados
    const checkPagos = db.prepare('SELECT COUNT(*) as count FROM pagos WHERE prestamo_id = ?')
    const { count } = checkPagos.get(this.id) as { count: number }

    if (count > 0) {
      throw new Error('No se puede eliminar un préstamo con pagos asociados')
    }

    const stmt = db.prepare('DELETE FROM prestamos WHERE id = ?')
    const result = stmt.run(this.id)
    return result.changes > 0
  }

  static obtenerPorCliente(clienteId: number, usuarioId?: number): Prestamo[] {
    let query = `
      SELECT p.*, c.nombre as cliente_nombre, c.ci, c.telefono 
      FROM prestamos p 
      JOIN clientes c ON p.cliente_id = c.id 
      WHERE p.cliente_id = ?
    `;
    
    // Si tenemos un ID de usuario, agregamos la condición
    if (usuarioId) {
      query += ` AND c.usuario_id = ? `;
    }
    
    query += ` ORDER BY p.fecha_prestamo DESC`;
    
    const stmt = db.prepare(query);
    
    // Ejecutamos la consulta con los parámetros correspondientes
    const results = usuarioId 
      ? stmt.all(clienteId, usuarioId) 
      : stmt.all(clienteId);

    return results.map((r: any) => {
      const prestamo = new Prestamo(r)
      if (r.cliente_nombre) {
        prestamo.cliente = new Cliente({
          id: r.cliente_id,
          nombre: r.cliente_nombre,
          ci: r.ci,
          telefono: r.telefono,
          direccion: r.direccion,
          ubicacion_casa: r.ubicacion_casa,
          referencia_casa: r.referencia_casa,
          ubicacion_trabajo: r.ubicacion_trabajo,
          referencia_trabajo: r.referencia_trabajo,
          estado: r.estado || 'activo',
          usuario_id: r.usuario_id
        }, { validarCompleto: false })
      }
      return prestamo
    })
  }

  static buscar(termino: string, usuarioId?: number): Prestamo[] {
    let query = `
      SELECT p.*, c.nombre as cliente_nombre 
      FROM prestamos p 
      JOIN clientes c ON p.cliente_id = c.id 
      WHERE c.nombre LIKE ? OR c.ci LIKE ?
    `;
    
    // Si tenemos un ID de usuario, agregamos la condición
    if (usuarioId) {
      query += ` AND c.usuario_id = ? `;
    }
    
    query += ` ORDER BY p.fecha_prestamo DESC`;
    
    const stmt = db.prepare(query);
    
    // Ejecutamos la consulta con los parámetros correspondientes
    const searchTerm = `%${termino}%`
    const results = usuarioId 
      ? stmt.all(searchTerm, searchTerm, usuarioId) 
      : stmt.all(searchTerm, searchTerm);

    return results.map((r: any) => {
      const prestamo = new Prestamo(r)
      if (r.cliente_nombre) {
        prestamo.cliente = new Cliente({
          id: r.cliente_id,
          nombre: r.cliente_nombre,
          ci: r.ci,
          telefono: r.telefono,
          direccion: r.direccion,
          ubicacion_casa: r.ubicacion_casa,
          referencia_casa: r.referencia_casa,
          ubicacion_trabajo: r.ubicacion_trabajo,
          referencia_trabajo: r.referencia_trabajo,
          estado: r.estado || 'activo',
          usuario_id: r.usuario_id
        }, { validarCompleto: false })
      }
      return prestamo
    })
  }

  // Método para calcular el monto total a pagar (capital + interés)
  calcularMontoTotal(): number {
    return this.monto + (this.monto * this.interes) / 100
  }

  // Método para calcular el monto de cada cuota
  calcularMontoCuota(): number {
    return this.calcularMontoTotal() / this.cantidad_cuotas
  }

  /**
   * Registra un pago para este préstamo
   * @param monto El monto del pago
   * @param fecha_pago La fecha del pago (opcional, por defecto la fecha actual)
   * @returns El objeto Pago creado
   */
  registrarPago(monto: number, fecha_pago?: string): Pago {
    if (!this.id) {
      throw new Error('No se puede registrar un pago para un préstamo sin ID')
    }

    // Si no se proporciona fecha, usamos la fecha actual
    const fechaPago = fecha_pago || new Date().toISOString().split('T')[0]

    const pago: PagoData = {
      prestamo_id: this.id,
      monto,
      fecha_pago: fechaPago
    }

    // Crear el pago
    const nuevoPago = Pago.crear(pago)

    // Actualizar el estado del préstamo según corresponda
    this.actualizarEstadoPorPagos()

    return nuevoPago
  }

  /**
   * Obtiene todos los pagos realizados para este préstamo
   * @returns Array de objetos Pago
   */
  obtenerPagos(): Pago[] {
    if (!this.id) {
      throw new Error('No se pueden obtener pagos de un préstamo sin ID')
    }

    return Pago.obtenerPorPrestamo(this.id)
  }

  /**
   * Calcula el monto total pagado hasta el momento
   * @returns El monto total pagado
   */
  calcularMontoPagado(): number {
    const pagos = this.obtenerPagos()
    return pagos.reduce((total, pago) => total + pago.monto, 0)
  }

  /**
   * Calcula el saldo pendiente del préstamo
   * @returns El monto pendiente de pago
   */
  calcularSaldoPendiente(): number {
    const montoPagado = this.calcularMontoPagado()
    const montoTotal = this.calcularMontoTotal()
    return montoTotal - montoPagado
  }

  /**
   * Actualiza el estado del préstamo basado en los pagos realizados
   * @returns true si se actualizó el estado, false si no hubo cambios
   */
  actualizarEstadoPorPagos(): boolean {
    if (!this.id) {
      throw new Error('No se puede actualizar el estado de un préstamo sin ID')
    }

    const saldoPendiente = this.calcularSaldoPendiente()
    let nuevoEstado = this.estado

    // Si no queda saldo, el préstamo está pagado
    if (saldoPendiente <= 0) {
      nuevoEstado = 'pagado'
    } else {
      // Aquí podrías implementar lógica para determinar si está en mora
      // basado en la fecha del último pago y el intervalo de pago
      // Por ahora, dejamos el estado como está o lo ponemos como 'activo'
      nuevoEstado = this.estado === 'mora' ? 'mora' : 'activo'
    }

    // Solo actualiza si el estado cambió
    if (nuevoEstado !== this.estado) {
      this.estado = nuevoEstado
      return this.actualizar()
    }

    return false
  }
}
