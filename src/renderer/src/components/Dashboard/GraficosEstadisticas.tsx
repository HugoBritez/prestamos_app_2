import { useMemo } from 'react'
import type { Prestamo } from '../../types/Prestamo'
import type { Pago } from '../../types/Pago'

interface GraficosEstadisticasProps {
  prestamos: Prestamo[]
  pagos: Pago[]
}

export function GraficosEstadisticas({ prestamos, pagos }: GraficosEstadisticasProps) {
  const estadisticas = useMemo(() => {
    // Distribución de préstamos por estado
    const distribucionEstados = {
      activo: 0,
      pagado: 0,
      mora: 0,
      cancelado: 0
    }
    
    prestamos.forEach(prestamo => {
      if (prestamo.estado in distribucionEstados) {
        distribucionEstados[prestamo.estado as keyof typeof distribucionEstados]++
      }
    })
    
    // Calcular la tasa de morosidad
    const prestamosMora = prestamos.filter(p => p.estado === 'mora').length
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length
    const tasaMorosidad = prestamos.length > 0 
      ? (prestamosMora / (prestamosActivos + prestamosMora)) * 100 
      : 0
    
    return {
      distribucionEstados,
      tasaMorosidad
    }
  }, [prestamos, pagos])

  const formatearPorcentaje = (valor: number) => {
    return `${valor.toFixed(2)}%`
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
      
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-2">Distribución de Préstamos</h4>
        <div className="flex h-8 w-full rounded-md overflow-hidden">
          {Object.entries(estadisticas.distribucionEstados).map(([estado, cantidad], index) => {
            if (cantidad === 0) return null
            
            const total = Object.values(estadisticas.distribucionEstados).reduce((sum, val) => sum + val, 0)
            const porcentaje = total > 0 ? (cantidad / total) * 100 : 0
            
            let color = ''
            switch (estado) {
              case 'activo':
                color = 'bg-green-500'
                break
              case 'pagado':
                color = 'bg-blue-500'
                break
              case 'mora':
                color = 'bg-red-500'
                break
              case 'cancelado':
                color = 'bg-gray-500'
                break
              default:
                color = 'bg-gray-300'
            }
            
            return (
              <div 
                key={index} 
                className={color} 
                style={{ width: `${porcentaje}%` }}
                title={`${estado}: ${cantidad} (${porcentaje.toFixed(1)}%)`}
              ></div>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-sm mr-1"></div>
            <span className="text-xs">{`Activos: ${estadisticas.distribucionEstados.activo}`}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
            <span className="text-xs">{`Pagados: ${estadisticas.distribucionEstados.pagado}`}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-sm mr-1"></div>
            <span className="text-xs">{`En mora: ${estadisticas.distribucionEstados.mora}`}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded-sm mr-1"></div>
            <span className="text-xs">{`Cancelados: ${estadisticas.distribucionEstados.cancelado}`}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Indicadores Clave</h4>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Tasa de Morosidad</p>
            <div className="flex items-center">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${estadisticas.tasaMorosidad > 20 ? 'bg-red-500' : estadisticas.tasaMorosidad > 10 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(estadisticas.tasaMorosidad, 100)}%` }}
                ></div>
              </div>
              <span className="ml-3 text-sm font-medium">
                {formatearPorcentaje(estadisticas.tasaMorosidad)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 