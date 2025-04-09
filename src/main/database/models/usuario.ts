import fs from 'fs'
import path from 'path'
import { app } from 'electron'

// Definir la ruta del archivo JSON para usuarios
const USUARIOS_FILE = path.join(app.getPath('userData'), 'usuarios.json')

// Asegurar que el archivo exista
if (!fs.existsSync(USUARIOS_FILE)) {
  // Crear el archivo con un usuario admin por defecto (con contraseña hasheada en una implementación real)
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify([
    {
      id: 1,
      username: 'admin',
      password: 'admin123', // En producción, esto debería ser un hash
      nombre: 'Administrador',
      rol: 'admin',
      estado: 'activo'
    }
  ], null, 2))
}

// Interfaz para el modelo de Usuario
export interface Usuario {
  id: number
  username: string
  password: string
  nombre: string
  rol: 'admin' | 'usuario'
  estado: 'activo' | 'inactivo'
}

export class UsuarioModel {
  // Obtener todos los usuarios
  static obtenerTodos(): Usuario[] {
    const contenido = fs.readFileSync(USUARIOS_FILE, 'utf-8')
    return JSON.parse(contenido)
  }

  // Obtener un usuario por ID
  static obtenerPorId(id: number): Usuario | null {
    const usuarios = this.obtenerTodos()
    return usuarios.find(usuario => usuario.id === id) || null
  }

  // Obtener un usuario por username
  static obtenerPorUsername(username: string): Usuario | null {
    const usuarios = this.obtenerTodos()
    return usuarios.find(usuario => usuario.username === username) || null
  }

  // Crear un nuevo usuario
  static crear(usuarioData: Omit<Usuario, 'id'>): Usuario {
    const usuarios = this.obtenerTodos()
    
    // Verificar si el username ya existe
    if (usuarios.some(u => u.username === usuarioData.username)) {
      throw new Error('El nombre de usuario ya existe')
    }
    
    // Obtener el siguiente ID
    const nextId = usuarios.length > 0 
      ? Math.max(...usuarios.map(u => u.id)) + 1 
      : 1
    
    // Crear el nuevo usuario
    const nuevoUsuario: Usuario = {
      id: nextId,
      ...usuarioData
    }
    
    // Agregar a la lista y guardar
    usuarios.push(nuevoUsuario)
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2))
    
    return nuevoUsuario
  }

  // Actualizar un usuario existente
  static actualizar(usuario: Usuario): boolean {
    const usuarios = this.obtenerTodos()
    const index = usuarios.findIndex(u => u.id === usuario.id)
    
    if (index === -1) {
      return false
    }
    
    // Verificar si intenta cambiar el username y ya existe
    if (usuario.username !== usuarios[index].username && 
        usuarios.some(u => u.username === usuario.username)) {
      throw new Error('El nombre de usuario ya existe')
    }
    
    usuarios[index] = usuario
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2))
    
    return true
  }

  // Eliminar un usuario
  static eliminar(id: number): boolean {
    const usuarios = this.obtenerTodos()
    const nuevaLista = usuarios.filter(u => u.id !== id)
    
    if (nuevaLista.length === usuarios.length) {
      return false
    }
    
    fs.writeFileSync(USUARIOS_FILE, JSON.stringify(nuevaLista, null, 2))
    return true
  }

  // Validar credenciales
  static validarCredenciales(username: string, password: string): Usuario | null {
    const usuario = this.obtenerPorUsername(username)
    
    if (!usuario || usuario.password !== password || usuario.estado !== 'activo') {
      return null
    }
    
    return usuario
  }
} 