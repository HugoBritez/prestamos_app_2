import Database from 'better-sqlite3'

export function setupSchema(db: Database.Database) {
  // Crear tabla de usuarios primero
  db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            nombre TEXT NOT NULL,
            rol TEXT DEFAULT 'usuario' NOT NULL,
            estado TEXT DEFAULT 'activo' NOT NULL
        )
    `)

  // Verificar si hay usuarios, si no, crear un usuario predeterminado
  const userCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get()
  if (userCount.count === 0) {
    console.log('Creando usuario administrador predeterminado...')
    db.prepare(
      'INSERT INTO usuarios (username, password, nombre, rol, estado) VALUES (?, ?, ?, ?, ?)'
    ).run('admin', 'admin123', 'Administrador', 'admin', 'activo')
  }

  // Verificar si la tabla clientes existe
  const clienteTableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clientes'")
    .get()

  if (!clienteTableExists) {
    // Si la tabla no existe, crearla con el campo usuario_id
    db.exec(`
            CREATE TABLE IF NOT EXISTS clientes
            (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                ci TEXT NOT NULL,
                telefono TEXT NOT NULL,
                direccion TEXT NOT NULL,
                ubicacion_casa TEXT NOT NULL,
                referencia_casa TEXT NOT NULL,
                ubicacion_trabajo TEXT NOT NULL,
                referencia_trabajo TEXT NOT NULL,
                estado TEXT NOT NULL,
                usuario_id INTEGER
            )
        `)
  } else {
    // Si la tabla ya existe, verificar si tiene la columna usuario_id
    const columnInfo = db.prepare('PRAGMA table_info(clientes)').all()
    const usuarioIdExists = columnInfo.some((col: any) => col.name === 'usuario_id')

    if (!usuarioIdExists) {
      // Añadir la columna usuario_id si no existe
      db.exec('ALTER TABLE clientes ADD COLUMN usuario_id INTEGER')

      // Asignar todos los clientes existentes al primer usuario
      const firstUser = db.prepare('SELECT id FROM usuarios ORDER BY id LIMIT 1').get()
      if (firstUser) {
        db.exec(`UPDATE clientes SET usuario_id = ${firstUser.id} WHERE usuario_id IS NULL`)
      }
    }
  }

  // Resto de las tablas (prestamos, pagos)
  db.exec(`
        CREATE TABLE IF NOT EXISTS prestamos
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_prestamo TEXT NOT NULL,
            cliente_id INTEGER NOT NULL,
            monto REAL NOT NULL,
            cantidad_cuotas INTEGER NOT NULL,
            interes REAL NOT NULL,
            intervalo_pago TEXT NOT NULL,
            estado TEXT NOT NULL,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        )
    `)

  db.exec(`
        CREATE TABLE IF NOT EXISTS pagos
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prestamo_id INTEGER NOT NULL,
            fecha_pago TEXT NOT NULL,
            monto REAL NOT NULL,
            metodo_pago TEXT DEFAULT 'efectivo',
            FOREIGN KEY (prestamo_id) REFERENCES prestamos(id)
        )
    `)
}
