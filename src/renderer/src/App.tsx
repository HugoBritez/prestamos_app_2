import { useState, useEffect } from 'react'
import { Sidebar } from './modules/Sidebar'
import { Clientes } from './components/Clientes/intex'
import { Dashboard } from './components/Dashboard'
import { Prestamos } from './components/Prestamos'
import { DetallesPrestamo } from './components/Prestamos/DetallesPrestamo'
import { Login } from './components/Auth/Login'
import { Usuario } from './types/types'

function App(): JSX.Element {
  const [authenticated, setAuthenticated] = useState(false)
  const [, setCurrentUser] = useState<Usuario | null>(null)
  const [activeModule, setActiveModule] = useState('dashboard')
  const [activePrestamo, setActivePrestamo] = useState<number | null>(null)
  const [, setActiveCliente] = useState<number | null>(null)

  // Verificar si hay un usuario autenticado al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await window.api.auth.getCurrentUser()
        if (user) {
          setCurrentUser(user)
          setAuthenticated(true)
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = async (success: boolean) => {
    if (success) {
      // Temporalmente omitimos getCurrentUser
      // const user = await window.api.auth.getCurrentUser()
      // setCurrentUser(user)
      setAuthenticated(true)
      setActiveModule('dashboard')
    }
  }

  const handleLogout = async () => {
    await window.api.auth.logout()
    setCurrentUser(null)
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        onMenuItemClick={(module) => {
          setActiveModule(module)
          setActivePrestamo(null)
          setActiveCliente(null)
        }}
        activeModule={activeModule}
        onLogout={handleLogout}  // Pasar la función de logout al Sidebar
      />

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              {activeModule === 'clientes' && 'Clientes'}
              {activeModule === 'prestamos' && 'Préstamos'}
              {activeModule === 'dashboard' && 'Dashboard'}
            </h1>
            {/* Quitamos el botón de logout del header */}
          </div>
        </header>

        {/* Contenido de la ruta actual */}
        <main>
          {activeModule === 'clientes' && <Clientes />}
          {activeModule === 'prestamos' && !activePrestamo && <Prestamos />}
          {activeModule === 'prestamos' && activePrestamo && (
            <DetallesPrestamo
              prestamoId={activePrestamo}
              onBack={() => setActivePrestamo(null)}
              onEdit={() => {
                /* lógica de edición */
              }}
            />
          )}
          {activeModule === 'dashboard' && <Dashboard />}
        </main>
      </div>
    </div>
  )
}

export default App
