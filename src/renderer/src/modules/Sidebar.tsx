import { HandCoins, LogOutIcon, ChartAreaIcon } from 'lucide-react'
import { UserIcon } from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  onMenuItemClick: (module: string) => void
  activeModule: string
  onLogout: () => void
}

export function Sidebar({ onMenuItemClick, activeModule, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const handleLogout = () => {
    onLogout();
  }

  return (
    <>
      {/* Overlay para cerrar el sidebar en dispositivos móviles */}
      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Botón de toggle para mostrar/ocultar sidebar en móviles */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-30 bg-blue-600 text-white p-2 rounded-md shadow-lg"
      >
        {collapsed ? '☰' : '✕'}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed h-full bg-gray-800 text-white shadow-xl transition-all duration-300 z-30
                    ${collapsed ? '-translate-x-full' : 'translate-x-0'} 
                    md:translate-x-0 md:w-64 md:static md:z-0`}
      >
        {/* Logo / Título de la App */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Sistema de Préstamos</h1>
        </div>

        {/* Enlaces de navegación */}
        <nav className="mt-6">
          <ul>
            <li>
              <button
                onClick={() => onMenuItemClick('dashboard')}
                className={`w-full flex items-center px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 transition-colors ${
                  activeModule === 'dashboard' ? 'bg-indigo-700 font-medium' : ''
                }`}
              >
                <ChartAreaIcon size={18} className="mr-3" />
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => onMenuItemClick('clientes')}
                className={`w-full flex items-center px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 transition-colors ${
                  activeModule === 'clientes' ? 'bg-indigo-700 font-medium' : ''
                }`}
              >
                <UserIcon size={18} className="mr-3" />
                Clientes
              </button>
            </li>
            <li>
              <button
                onClick={() => onMenuItemClick('prestamos')}
                className={`w-full flex items-center px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 transition-colors ${
                  activeModule === 'prestamos' ? 'bg-indigo-700 font-medium' : ''
                }`}
              >
                <HandCoins size={18} className="mr-3" />
                Préstamos
              </button>
            </li>
          </ul>
        </nav>
        {/* Footer del Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 flex flex-col items-center gap-2 justify-between">
          <button 
            onClick={handleLogout}
            className="w-1/2 flex items-center gap-2 bg-red-600 text-white p-2 rounded-md ease-in-out duration-300 hover:bg-white hover:text-red-600 transition-colors"
          >
            <LogOutIcon size={16} /> <p className="text-xs">Cerrar sesión</p>
          </button>
          <p className="text-xs text-gray-400 text-center">Desarrollado por INSIGHT</p>
        </div>
      </div>
    </>
  )
}