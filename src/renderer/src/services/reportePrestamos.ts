import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

// Inicializar pdfMake con las fuentes virtuales
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs

interface ContentStyle {
  fontSize?: number
  bold?: boolean
  alignment?: string
  margin?: number[]
  color?: string
  italics?: boolean
}

interface DocumentDefinition {
  pageSize: string
  pageMargins: number[]
  content: any[]
  styles: { [key: string]: ContentStyle }
}

// Función auxiliar para formatear montos en guaraníes
const formatearMonto = (monto: number): string => {
  return new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'PYG'
  }).format(monto).replace('PYG', 'Gs.')
}

export const generarReportePrestamos = async (filtros: {
  fechaDesde?: string
  fechaHasta?: string
  clienteId?: number
}): Promise<void> => {
  try {
    console.log('Generando reporte con filtros:', filtros)
    
    // Obtener todos los pagos
    const pagos = await window.api.pagos.obtenerTodos()
    
    // Filtrar pagos por fecha y cliente si es necesario
    const pagosFiltrados = pagos.filter(pago => {
      const fechaPago = new Date(pago.fecha_pago)
      const cumpleFecha = (!filtros.fechaDesde || fechaPago >= new Date(filtros.fechaDesde)) &&
                         (!filtros.fechaHasta || fechaPago <= new Date(filtros.fechaHasta))
      const cumpleCliente = !filtros.clienteId || (pago.prestamo?.cliente_id === filtros.clienteId)
      return cumpleFecha && cumpleCliente
    })

    if (!pagosFiltrados || pagosFiltrados.length === 0) {
      throw new Error('No se encontraron pagos en el período especificado')
    }

    // Agrupar pagos por préstamo
    const pagosPorPrestamo = new Map<number, {
      prestamo: any,
      pagos: any[],
      montoCobrado: number,
      interesCobrado: number,
      capitalCobrado: number,
      totalPagosRealizados: number
    }>()

    // Procesar cada pago
    for (const pago of pagosFiltrados) {
      const prestamo = await window.api.prestamos.obtenerPorId(pago.prestamo_id)
      if (!prestamo || !prestamo.id) continue

      const valorCuota = (prestamo.monto + (prestamo.monto * prestamo.interes / 100)) / prestamo.cantidad_cuotas
      const interesPorCuota = valorCuota - (prestamo.monto / prestamo.cantidad_cuotas)
      
      // Obtener todos los pagos del préstamo (sin filtro de fechas)
      const todosPagosPrestamo = await window.api.pagos.obtenerPorPrestamo(prestamo.id)
      
      const infoPrestamo = pagosPorPrestamo.get(prestamo.id) || {
        prestamo,
        pagos: [],
        montoCobrado: 0,
        interesCobrado: 0,
        capitalCobrado: 0,
        totalPagosRealizados: todosPagosPrestamo.length
      }

      infoPrestamo.pagos.push(pago)
      infoPrestamo.montoCobrado += pago.monto
      infoPrestamo.interesCobrado += interesPorCuota
      infoPrestamo.capitalCobrado += (pago.monto - interesPorCuota)

      pagosPorPrestamo.set(prestamo.id, infoPrestamo)
    }

    // Convertir el Map a array para el reporte
    const prestamosConPagos = Array.from(pagosPorPrestamo.values())

    // Calcular totales
    const totalCapitalCobrado = prestamosConPagos.reduce((sum, p) => sum + p.capitalCobrado, 0)
    const totalInteresCobrado = prestamosConPagos.reduce((sum, p) => sum + p.interesCobrado, 0)
    const totalMontoCobrado = prestamosConPagos.reduce((sum, p) => sum + p.montoCobrado, 0)

    // Definir documento
    const docDefinition: DocumentDefinition = {
      pageSize: 'A4',
      pageMargins: [20, 10, 20, 10],
      content: [
        // Encabezado
        {
          text: new Date().toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          alignment: 'left',
          margin: [0, 0, 0, 20],
          fontSize: 12
        },
        {
          text: 'INFORME SEMANAL DE COBROS',
          style: 'titulo',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        
        // Período del reporte
        {
          text: `Período: ${filtros.fechaDesde ? new Date(filtros.fechaDesde).toLocaleDateString('es-PY') : 'Inicio'} - ${filtros.fechaHasta ? new Date(filtros.fechaHasta).toLocaleDateString('es-PY') : 'Actual'}`,
          alignment: 'center',
          margin: [0, 0, 0, 20],
          fontSize: 11
        },
        
        // Tabla de cobros por préstamo
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'ID', style: 'tableHeader' },
                { text: 'Fecha', style: 'tableHeader' },
                { text: 'Cliente', style: 'tableHeader' },
                { text: 'Capital cobrado', style: 'tableHeader' },
                { text: 'Interés cobrado', style: 'tableHeader' },
                { text: 'Total cobrado', style: 'tableHeader' },
                { text: 'Cuotas pagadas', style: 'tableHeader' }
              ],
              ...prestamosConPagos.map((p) => [
                { text: p.prestamo.id?.toString() || '', style: 'tableCell' },
                { text: p.pagos[p.pagos.length - 1].fecha_pago, style: 'tableCell' },
                { text: p.prestamo.cliente?.nombre || '', style: 'tableCell' },
                { text: formatearMonto(p.capitalCobrado), style: 'tableCell' },
                { text: formatearMonto(p.interesCobrado), style: 'tableCell' },
                { text: formatearMonto(p.montoCobrado), style: 'tableCell' },
                { text: `${p.totalPagosRealizados}/${p.prestamo.cantidad_cuotas}`, style: 'tableCell' }
              ])
            ]
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              return i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5
            },
            vLineWidth: function (i: number, node: any) {
              return i === 0 || i === node.table.widths.length ? 1 : 0.5
            },
            hLineColor: function (i: number) {
              return i === 1 ? 'black' : '#aaa'
            },
            vLineColor: function () {
              return '#aaa'
            },
            paddingLeft: function () {
              return 5
            },
            paddingRight: function () {
              return 5
            },
            paddingTop: function () {
              return 3
            },
            paddingBottom: function () {
              return 3
            }
          }
        },
        // Resumen de totales
        {
          table: {
            widths: ['100%'],
            body: [
              [
                {
                  stack: [
                    {
                      table: {
                        widths: ['50%', '50%'],
                        body: [
                          [
                            { text: 'Total capital cobrado:', style: 'resumenTitulo' },
                            { text: formatearMonto(totalCapitalCobrado), style: 'resumen' }
                          ],
                          [
                            { text: 'Total interés cobrado:', style: 'resumenTitulo' },
                            { text: formatearMonto(totalInteresCobrado), style: 'resumen' }
                          ],
                          [
                            { text: 'Total monto cobrado:', style: 'resumenTitulo' },
                            { text: formatearMonto(totalMontoCobrado), style: 'resumen' }
                          ],

                          [
                            { text: 'Total cobrado efectivo:', style: 'resumenTitulo' },
                            { text: '', style: 'resumen' }
                          ],
                          [
                            { text: 'Total cobrado giro:', style: 'resumenTitulo' },
                            { text: '', style: 'resumen' }
                          ],
                          [
                            { text: 'Total monto transferencia:', style: 'resumenTitulo' },
                            { text: '', style: 'resumen' }
                          ]
                        ]
                      },
                      layout: {
                        hLineWidth: function (i: number) {
                          return i === 0 ? 1 : 0.5
                        },
                        vLineWidth: function () {
                          return 0.5
                        },
                        hLineColor: function () {
                          return '#aaa'
                        },
                        vLineColor: function () {
                          return '#aaa'
                        }
                      },
                      margin: [0, 0, 0, 20]
                    }
                  ],
                  style: 'metodoPago'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function () {
              return 1
            },
            vLineWidth: function () {
              return 1
            },
            hLineColor: function () {
              return 'black'
            },
            vLineColor: function () {
              return 'black'
            }
          },
          margin: [0, 40, 0, 0]
        }
      ],
      styles: {
        titulo: {
          fontSize: 16,
          bold: true
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          alignment: 'center'
        },
        tableCell: {
          fontSize: 9
        },
        resumenTitulo: {
          fontSize: 11,
          bold: true,
          margin: [0, 5, 0, 5]
        },
        resumen: {
          fontSize: 11,
          margin: [0, 5, 0, 5]
        },
        metodoPago: {
          fontSize: 11,
          margin: [10, 10, 10, 10]
        },
        metodoPagoTitulo: {
          fontSize: 11,
          bold: true
        },
        metodoPagoLinea: {
          fontSize: 11,
          margin: [0, 5, 0, 10]
        }
      }
    }

    // Generar el PDF
    const pdfDocGenerator = pdfMake.createPdf(docDefinition as any)

    // Descargar el PDF
    pdfDocGenerator.download('Reporte_Prestamos.pdf')

    return Promise.resolve()
  } catch (error) {
    console.error('Error al generar el reporte:', error)
    return Promise.reject(error)
  }
}
