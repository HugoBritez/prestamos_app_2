import { ipcMain } from 'electron'
import { Prestamo } from './database/models/prestamos'

export function setupReportesHandlers() {
  ipcMain.handle('reportes:generarReportePrestamos', async (_, filtros) => {
    try {
      // Obtener todos los préstamos
      let prestamos = await Prestamo.obtenerTodos()

      // Aplicar filtros
      if (filtros.fechaDesde) {
        prestamos = prestamos.filter(p => p.fecha_prestamo >= filtros.fechaDesde)
      }
      if (filtros.fechaHasta) {
        prestamos = prestamos.filter(p => p.fecha_prestamo <= filtros.fechaHasta)
      }
      if (filtros.clienteId) {
        prestamos = prestamos.filter(p => p.cliente_id === filtros.clienteId)
      }

      return prestamos
    } catch (error) {
      console.error('Error al generar reporte de préstamos:', error)
      throw error
    }
  })
} 