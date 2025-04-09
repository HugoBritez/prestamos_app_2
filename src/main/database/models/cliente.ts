import db from '../index'

export interface ClienteData {
  id?: number
  nombre: string
  ci: string
  telefono: string
  direccion: string
  ubicacion_casa: string
  referencia_casa: string
  ubicacion_trabajo: string
  referencia_trabajo: string
  estado: string
  usuario_id: number
}

export class Cliente {
  id?: number
  nombre: string
  ci: string
  telefono: string
  direccion: string
  ubicacion_casa: string
  referencia_casa: string
  ubicacion_trabajo: string
  referencia_trabajo: string
  estado: string
  usuario_id: number

  constructor(
    cliente: ClienteData,
    opciones: { validarCompleto?: boolean } = { validarCompleto: true }
  ) {
    this.id = cliente.id
    this.nombre = cliente.nombre
    this.ci = cliente.ci
    this.telefono = cliente.telefono
    this.direccion = cliente.direccion
    this.ubicacion_casa = cliente.ubicacion_casa
    this.referencia_casa = cliente.referencia_casa
    this.ubicacion_trabajo = cliente.ubicacion_trabajo
    this.referencia_trabajo = cliente.referencia_trabajo
    this.estado = cliente.estado
    this.usuario_id = cliente.usuario_id

    // Solo validar los campos obligatorios si se requiere
    if (opciones.validarCompleto) {
      if (!cliente.nombre) {
        throw new Error('El nombre del cliente es requerido')
      }

      if (!cliente.ci) {
        throw new Error('El CI del cliente es requerido')
      }

      if (!cliente.telefono) {
        throw new Error('El telefono del cliente es requerido')
      }
    }
  }

  // El resto de los métodos permanecen igual
  static obtenerTodos(usuarioId?: number): Cliente[] {
    const stmt = db.prepare('SELECT * FROM clientes ORDER BY nombre')
    const results = stmt.all()
    
    // Si se proporciona un ID de usuario, filtrar solo esos clientes
    if (usuarioId) {
      return results.filter(r => r.usuario_id === usuarioId)
    }
    
    return results.map((r) => new Cliente(r))
  }

  static crear(cliente: Omit<Cliente, 'id'>): Cliente {
    // Aquí sí validamos todos los campos porque estamos creando un cliente nuevo
    const nuevoCliente = new Cliente(cliente)

    const stmt = db.prepare(
      'INSERT INTO clientes (nombre, ci, telefono, direccion, ubicacion_casa, referencia_casa, ubicacion_trabajo, referencia_trabajo, estado, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )

    const result = stmt.run(
      nuevoCliente.nombre,
      nuevoCliente.ci,
      nuevoCliente.telefono,
      nuevoCliente.direccion,
      nuevoCliente.ubicacion_casa,
      nuevoCliente.referencia_casa,
      nuevoCliente.ubicacion_trabajo,
      nuevoCliente.referencia_trabajo,
      nuevoCliente.estado,
      nuevoCliente.usuario_id
    )

    return new Cliente({
      ...cliente,
      id: result.lastInsertRowid as number
    })
  }

  static obtenerPorId(id: number): Cliente | null {
    const stmt = db.prepare('SELECT * FROM clientes WHERE id = ?')
    const result = stmt.get(id)
    return result ? new Cliente(result) : null
  }

  actualizar(): boolean {
    if (!this.id) throw new Error('No se puede actualizar un cliente sin ID')

    const stmt = db.prepare(
      'UPDATE clientes SET nombre = ?, telefono = ?, direccion = ?, ubicacion_casa = ?, referencia_casa = ?, ubicacion_trabajo = ?, referencia_trabajo = ?, estado = ? WHERE id = ?'
    )

    const result = stmt.run(
      this.nombre,
      this.telefono,
      this.direccion,
      this.ubicacion_casa,
      this.referencia_casa,
      this.ubicacion_trabajo,
      this.referencia_trabajo,
      this.estado,
      this.id
    )

    return result.changes > 0
  }

  eliminar(): boolean {
    if (!this.id) throw new Error('No se puede eliminar un cliente sin ID')

    const stmt = db.prepare('DELETE FROM clientes WHERE id = ?')
    const result = stmt.run(this.id)
    return result.changes > 0
  }

  static buscarCliente(termino: string, usuarioId?: number): Cliente[] {
    const clientes = this.obtenerTodos(usuarioId)
    
    let resultados = clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(termino.toLowerCase()) || 
      cliente.ci.includes(termino)
    )
    
    return resultados
  }
}
