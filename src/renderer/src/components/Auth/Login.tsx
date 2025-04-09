import { useState } from 'react'

interface LoginProps {
  onLogin: (success: boolean) => void
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegistro, setShowRegistro] = useState(false)
  
  // Estados para el formulario de registro
  const [nuevoUsername, setNuevoUsername] = useState('')
  const [nuevoPassword, setNuevoPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [errorRegistro, setErrorRegistro] = useState('')
  const [loadingRegistro, setLoadingRegistro] = useState(false)
  const [registroExitoso, setRegistroExitoso] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Aquí hacemos la verificación de las credenciales
      const success = await window.api.auth.login(username, password)
      
      if (success) {
        onLogin(true)
      } else {
        setError('Credenciales incorrectas')
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intente nuevamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegistroSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingRegistro(true)
    setErrorRegistro('')
    setRegistroExitoso(false)

    try {
      // Validaciones
      if (!nuevoUsername || !nuevoPassword || !confirmarPassword || !nuevoNombre) {
        throw new Error('Todos los campos son obligatorios')
      }

      if (nuevoPassword !== confirmarPassword) {
        throw new Error('Las contraseñas no coinciden')
      }

      if (nuevoPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      // Crear el nuevo usuario
      await window.api.auth.registrar({
        username: nuevoUsername,
        password: nuevoPassword,
        nombre: nuevoNombre,
        rol: 'usuario',
        estado: 'activo'
      })

      // Mostrar mensaje de éxito
      setRegistroExitoso(true)
      
      // Limpiar el formulario
      setNuevoUsername('')
      setNuevoPassword('')
      setConfirmarPassword('')
      setNuevoNombre('')
      
      // Después de 3 segundos, volver al formulario de login
      setTimeout(() => {
        setShowRegistro(false)
        setRegistroExitoso(false)
      }, 3000)

    } catch (err: any) {
      setErrorRegistro(err.message || 'Error al crear el usuario')
      console.error(err)
    } finally {
      setLoadingRegistro(false)
    }
  }

  const toggleFormulario = () => {
    setShowRegistro(!showRegistro)
    setError('')
    setErrorRegistro('')
    setRegistroExitoso(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Préstamos
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {!showRegistro 
              ? 'Ingrese sus credenciales para continuar' 
              : 'Complete el formulario para crear un nuevo usuario'}
          </p>
        </div>
        
        {!showRegistro ? (
          // Formulario de login
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">
                  Nombre de usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading 
                    ? 'bg-indigo-400' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                ) : null}
                Iniciar sesión
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={toggleFormulario}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                ¿No tienes cuenta? Crear usuario
              </button>
            </div>
          </form>
        ) : (
          // Formulario de registro
          <form className="mt-8 space-y-6" onSubmit={handleRegistroSubmit}>
            <div className="rounded-md shadow-sm space-y-2">
              <div>
                <label htmlFor="nuevoNombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  id="nuevoNombre"
                  name="nuevoNombre"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Nombre completo"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="nuevoUsername" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de usuario
                </label>
                <input
                  id="nuevoUsername"
                  name="nuevoUsername"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Nombre de usuario"
                  value={nuevoUsername}
                  onChange={(e) => setNuevoUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="nuevoPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="nuevoPassword"
                  name="nuevoPassword"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirmarPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmarPassword"
                  name="confirmarPassword"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirmar contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                />
              </div>
            </div>

            {errorRegistro && (
              <div className="text-red-500 text-sm text-center">{errorRegistro}</div>
            )}
            
            {registroExitoso && (
              <div className="text-green-500 text-sm text-center font-semibold">
                ¡Usuario creado con éxito! Redirigiendo al inicio de sesión...
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={toggleFormulario}
                disabled={loadingRegistro}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loadingRegistro || registroExitoso}
                className={`flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loadingRegistro || registroExitoso
                    ? 'bg-indigo-400' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {loadingRegistro ? (
                  <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                ) : null}
                Crear usuario
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 