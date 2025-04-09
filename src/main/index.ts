import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { Cliente } from './database/models/cliente'
import { Prestamo } from './database/models/prestamos'
import { Pago } from './database/models/pagos'
import { UsuarioModel } from './database/models/usuario'
import { setupReportesHandlers } from './reportes'
import * as fs from 'fs'
import * as path from 'path'

// Variable para almacenar el usuario actual
let currentUser: any = null;

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
    ipcMain.handle('clientes:obtenerTodos', async () => {
      try {
        if (!currentUser) {
          throw new Error('Usuario no autenticado')
        }
        return Cliente.obtenerTodos(currentUser.id)
      } catch (error: any) {
        console.error('Error al obtener clientes:', error)
        throw new Error(`Error al obtener clientes: ${error.message}`)
      }
    })

    ipcMain.handle('clientes:obtenerPorId', async (_, id: number) => {
      try {
        return Cliente.obtenerPorId(id)
      } catch (error: any) {
        console.error(`Error al obtener cliente con ID ${id}:`, error)
        throw new Error(`Error al obtener cliente: ${error.message}`)
      }
    })

    ipcMain.handle('clientes:crear', async (_, clienteData: any) => {
      try {
        if (!currentUser) {
          throw new Error('Usuario no autenticado')
        }
        
        // Asegurar que el cliente se asigne al usuario actual
        clienteData.usuario_id = currentUser.id
        
        // Validamos que esté completo
        if (!clienteData.nombre || !clienteData.ci || !clienteData.telefono) {
          throw new Error('Datos de cliente incompletos')
        }

        // Creamos instancia de Cliente para validaciones
        const cliente = new Cliente(clienteData)
        return Cliente.crear(cliente)
      } catch (error: any) {
        console.error('Error al crear cliente:', error)
        throw new Error(`Error al crear cliente: ${error.message}`)
      }
    })

    ipcMain.handle('clientes:actualizar', async (_, clienteData: any) => {
      try {
        // Validamos que tenga ID
        if (!clienteData.id) {
          throw new Error('ID de cliente requerido para actualizar')
        }

        // Creamos instancia de Cliente y actualizamos
        const cliente = new Cliente(clienteData)
        return cliente.actualizar()
      } catch (error: any) {
        console.error('Error al actualizar cliente:', error)
        throw new Error(`Error al actualizar cliente: ${error.message}`)
      }
    })

    ipcMain.handle('clientes:eliminar', async (_, id: number) => {
      try {
        const cliente = Cliente.obtenerPorId(id)
        if (!cliente) {
          throw new Error('Cliente no encontrado')
        }

        return cliente.eliminar()
      } catch (error: any) {
        console.error(`Error al eliminar cliente con ID ${id}:`, error)
        throw new Error(`Error al eliminar cliente: ${error.message}`)
      }
    })

    ipcMain.handle('clientes:buscar', async (_, termino: string) => {
      try {
        return Cliente.buscarCliente(termino)
      } catch (error: any) {
        console.error(`Error al buscar clientes con término "${termino}":`, error)
        throw new Error(`Error al buscar clientes: ${error.message}`)
      }
    })

    ipcMain.handle('prestamos:obtenerTodos', () => {
      try {
        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }
        // Pasar el ID del usuario actual para filtrar préstamos
        return Prestamo.obtenerTodos(currentUser.id);
      } catch (error: any) {
        console.error('Error al obtener préstamos:', error);
        throw new Error(`Error al obtener préstamos: ${error.message}`);
      }
    })

    ipcMain.handle('prestamos:obtenerPorId', (_, id: number) => {
      try {
        return Prestamo.obtenerPorId(id)
      } catch (error: any) {
        console.error(`Error al obtener préstamo con ID ${id}:`, error)
        throw new Error(`Error al obtener préstamo: ${error.message}`)
      }
    })

    ipcMain.handle('prestamos:crear', (_, prestamoData: any) => {
      try {
        // Creamos instancia de Prestamo para validaciones
        const prestamo = new Prestamo(prestamoData)
        return Prestamo.crear(prestamo)
      } catch (error: any) {
        console.error('Error al crear préstamo:', error)
        throw new Error(`Error al crear préstamo: ${error.message}`)
      }
    })

    ipcMain.handle('prestamos:actualizar', (_, prestamoData: any) => {
      try {
        // Validamos que tenga ID
        if (!prestamoData.id) {
          throw new Error('ID de préstamo requerido para actualizar')
        }

        // Creamos instancia de Prestamo y actualizamos
        const prestamo = new Prestamo(prestamoData)
        return prestamo.actualizar()
      } catch (error: any) {
        console.error('Error al actualizar préstamo:', error)
        throw new Error(`Error al actualizar préstamo: ${error.message}`)
      }
    })

    ipcMain.handle('prestamos:eliminar', (_, id: number) => {
      try {
        const prestamo = Prestamo.obtenerPorId(id)
        if (!prestamo) {
          throw new Error('Préstamo no encontrado')
        }

        return prestamo.eliminar()
      } catch (error: any) {
        console.error(`Error al eliminar préstamo con ID ${id}:`, error)
        throw new Error(`Error al eliminar préstamo: ${error.message}`)
      }
    })

    ipcMain.handle('prestamos:obtenerPorCliente', (_, clienteId: number) => {
      try {
        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }
        return Prestamo.obtenerPorCliente(clienteId, currentUser.id);
      } catch (error: any) {
        console.error(`Error al obtener préstamos del cliente ${clienteId}:`, error);
        throw new Error(`Error al obtener préstamos: ${error.message}`);
      }
    })

    ipcMain.handle('prestamos:buscar', (_, termino: string) => {
      try {
        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }
        return Prestamo.buscar(termino, currentUser.id);
      } catch (error: any) {
        console.error(`Error al buscar préstamos:`, error);
        throw new Error(`Error al buscar préstamos: ${error.message}`);
      }
    })

  // Handlers para pagos
  ipcMain.handle('pagos:obtenerTodos', async () => {
    try {
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      return Pago.obtenerTodos(currentUser.id)
    } catch (error: any) {
      console.error('Error al obtener pagos:', error)
      throw new Error(`Error al obtener pagos: ${error.message}`)
    }
  })

  ipcMain.handle('pagos:obtenerPorId', async (_, id: number) => {
    try {
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      const pago = await Pago.obtenerPorId(id)
      if (!pago) {
        throw new Error('Pago no encontrado')
      }

      // Verificar que el pago pertenezca a un cliente del usuario actual
      const prestamo = await Prestamo.obtenerPorId(pago.prestamo_id)
      if (!prestamo) {
        throw new Error('Préstamo no encontrado')
      }

      const cliente = await Cliente.obtenerPorId(prestamo.cliente_id)
      if (!cliente || cliente.usuario_id !== currentUser.id) {
        throw new Error('No tiene permiso para ver este pago')
      }

      return pago
    } catch (error: any) {
      console.error(`Error al obtener pago con ID ${id}:`, error)
      throw new Error(`Error al obtener pago: ${error.message}`)
    }
  })

  ipcMain.handle('pagos:crear', async (_, pagoData: any) => {
    try {
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      // Validar que el préstamo pertenezca a un cliente del usuario actual
      const prestamo = await Prestamo.obtenerPorId(pagoData.prestamo_id)
      if (!prestamo) {
        throw new Error('Préstamo no encontrado')
      }

      const cliente = await Cliente.obtenerPorId(prestamo.cliente_id)
      if (!cliente || cliente.usuario_id !== currentUser.id) {
        throw new Error('No tiene permiso para crear pagos en este préstamo')
      }
      
      // Validamos que esté completo
      if (!pagoData.prestamo_id || !pagoData.monto || !pagoData.fecha_pago) {
        throw new Error('Datos de pago incompletos')
      }

      // Creamos instancia de Pago para validaciones
      const pago = new Pago(pagoData)
      return Pago.crear(pago)
    } catch (error: any) {
      console.error('Error al crear pago:', error)
      throw new Error(`Error al crear pago: ${error.message}`)
    }
  })

  ipcMain.handle('pagos:actualizar', async (_, pagoData: any) => {
    try {
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      // Validar que el pago pertenezca a un cliente del usuario actual
      const pagoExistente = await Pago.obtenerPorId(pagoData.id)
      if (!pagoExistente) {
        throw new Error('Pago no encontrado')
      }

      const prestamo = await Prestamo.obtenerPorId(pagoExistente.prestamo_id)
      if (!prestamo) {
        throw new Error('Préstamo no encontrado')
      }

      const cliente = await Cliente.obtenerPorId(prestamo.cliente_id)
      if (!cliente || cliente.usuario_id !== currentUser.id) {
        throw new Error('No tiene permiso para actualizar este pago')
      }

      // Creamos instancia de Pago para validaciones
      const pago = new Pago(pagoData)
      return Pago.actualizar(pago)
    } catch (error: any) {
      console.error('Error al actualizar pago:', error)
      throw new Error(`Error al actualizar pago: ${error.message}`)
    }
  })

  ipcMain.handle('pagos:eliminar', async (_, id: number) => {
    try {
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      // Validar que el pago pertenezca a un cliente del usuario actual
      const pago = await Pago.obtenerPorId(id)
      if (!pago) {
        throw new Error('Pago no encontrado')
      }

      const prestamo = await Prestamo.obtenerPorId(pago.prestamo_id)
      if (!prestamo) {
        throw new Error('Préstamo no encontrado')
      }

      const cliente = await Cliente.obtenerPorId(prestamo.cliente_id)
      if (!cliente || cliente.usuario_id !== currentUser.id) {
        throw new Error('No tiene permiso para eliminar este pago')
      }

      return Pago.eliminar(id)
    } catch (error: any) {
      console.error(`Error al eliminar pago con ID ${id}:`, error)
      throw new Error(`Error al eliminar pago: ${error.message}`)
    }
  })

  ipcMain.handle('pagos:obtenerPorPrestamo', async (_, prestamoId: number) => {
    try {
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      // Validar que el préstamo pertenezca a un cliente del usuario actual
      const prestamo = await Prestamo.obtenerPorId(prestamoId)
      if (!prestamo) {
        throw new Error('Préstamo no encontrado')
      }

      const cliente = await Cliente.obtenerPorId(prestamo.cliente_id)
      if (!cliente || cliente.usuario_id !== currentUser.id) {
        throw new Error('No tiene permiso para ver los pagos de este préstamo')
      }

      return Pago.obtenerPorPrestamo(prestamoId)
    } catch (error: any) {
      console.error(`Error al obtener pagos del préstamo ${prestamoId}:`, error)
      throw new Error(`Error al obtener pagos: ${error.message}`)
    }
  })

  ipcMain.handle('pagos:registrarPago', (_, prestamoId: number, monto: number, fecha_pago?: string) => {
    try {
      const prestamo = Prestamo.obtenerPorId(prestamoId)
      if (!prestamo) {
        throw new Error('Préstamo no encontrado')
      }

      return prestamo.registrarPago(monto, fecha_pago)
    } catch (error: any) {
      console.error(`Error al registrar pago para el préstamo ${prestamoId}:`, error)
      throw new Error(`Error al registrar pago: ${error.message}`)
    }
  })

  // Handlers para Usuarios
  ipcMain.handle('usuarios:obtenerTodos', async () => {
    try {
      return UsuarioModel.obtenerTodos()
        .map(u => {
          // Excluir la contraseña por seguridad
          const { password, ...userData } = u;
          return userData;
        });
    } catch (error: any) {
      console.error('Error al obtener usuarios:', error)
      throw new Error(`Error al obtener usuarios: ${error.message}`)
    }
  })

  ipcMain.handle('usuarios:obtenerPorId', async (_, id: number) => {
    try {
      const usuario = UsuarioModel.obtenerPorId(id);
      if (usuario) {
        // Excluir la contraseña por seguridad
        const { password, ...userData } = usuario;
        return userData;
      }
      return null;
    } catch (error: any) {
      console.error(`Error al obtener usuario con ID ${id}:`, error)
      throw new Error(`Error al obtener usuario: ${error.message}`)
    }
  })

  ipcMain.handle('usuarios:crear', async (_, usuarioData: any) => {
    try {
      if (!usuarioData.username || !usuarioData.password || !usuarioData.nombre) {
        throw new Error('Datos de usuario incompletos')
      }

      const nuevoUsuario = UsuarioModel.crear(usuarioData);
      // Excluir la contraseña por seguridad
      const { password, ...userData } = nuevoUsuario;
      return userData;
    } catch (error: any) {
      console.error('Error al crear usuario:', error)
      throw new Error(`Error al crear usuario: ${error.message}`)
    }
  })

  ipcMain.handle('usuarios:actualizar', async (_, usuarioData: any) => {
    try {
      const usuario = UsuarioModel.obtenerPorId(usuarioData.id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Si se proporciona una nueva contraseña, actualizarla
      if (usuarioData.password) {
        usuario.password = usuarioData.password;
      }

      // Actualizar los otros campos
      usuario.username = usuarioData.username;
      usuario.nombre = usuarioData.nombre;
      usuario.rol = usuarioData.rol;
      usuario.estado = usuarioData.estado;

      return UsuarioModel.actualizar(usuario);
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error)
      throw new Error(`Error al actualizar usuario: ${error.message}`)
    }
  })

  ipcMain.handle('usuarios:eliminar', async (_, id: number) => {
    try {
      return UsuarioModel.eliminar(id);
    } catch (error: any) {
      console.error(`Error al eliminar usuario con ID ${id}:`, error)
      throw new Error(`Error al eliminar usuario: ${error.message}`)
    }
  })

  // Actualizar los handlers de autenticación
  ipcMain.handle('auth:login', (_, username: string, password: string) => {
    try {
      const usuario = UsuarioModel.validarCredenciales(username, password)
      if (usuario) {
        // Almacenar el usuario actual (sin la contraseña)
        const { password: _, ...userWithoutPassword } = usuario
        currentUser = userWithoutPassword
        return true
      }
      return false
    } catch (error: any) {
      console.error('Error al autenticar:', error)
      throw new Error(`Error en autenticación: ${error.message}`)
    }
  })

  ipcMain.handle('auth:registrar', async (_, usuarioData: any) => {
    try {
      if (!usuarioData.username || !usuarioData.password || !usuarioData.nombre) {
        throw new Error('Datos de usuario incompletos')
      }

      const nuevoUsuario = UsuarioModel.crear(usuarioData)
      // Excluir la contraseña por seguridad
      const { password, ...userData } = nuevoUsuario
      return userData
    } catch (error: any) {
      console.error('Error al registrar usuario:', error)
      throw new Error(`Error al registrar usuario: ${error.message}`)
    }
  })

  ipcMain.handle('auth:logout', () => {
    currentUser = null
    return true
  })

  ipcMain.handle('auth:getCurrentUser', () => {
    console.log('Solicitando usuario actual. Usuario:', currentUser)
    return currentUser
  })

  // Configurar manejadores de IPC
  setupReportesHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Manejador para abrir PDFs
ipcMain.handle('reportes:abrirPDF', async (_, pdfData: string) => {
  try {
    // Crear un directorio temporal si no existe
    const tempDir = path.join(app.getPath('temp'), 'prestamos_app')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Crear un archivo temporal único
    const tempFilePath = path.join(tempDir, `reporte_${Date.now()}.pdf`)

    // Convertir base64 a buffer y guardar el archivo
    const pdfBuffer = Buffer.from(pdfData, 'base64')
    fs.writeFileSync(tempFilePath, pdfBuffer)

    // Abrir el archivo con la aplicación predeterminada
    await shell.openPath(tempFilePath)

    // Programar la eliminación del archivo después de 5 minutos
    setTimeout(() => {
      try {
        fs.unlinkSync(tempFilePath)
      } catch (error) {
        console.error('Error al eliminar archivo temporal:', error)
      }
    }, 5 * 60 * 1000) // 5 minutos

  } catch (error) {
    console.error('Error al abrir PDF:', error)
    throw new Error('Error al abrir el PDF')
  }
})
