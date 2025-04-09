import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

// Inicializar pdfMake con las fuentes virtuales
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs

// Interfaz para los detalles de pago
export interface DetallePago {
  numeroCuota: number
  fechaVencimiento: string
  monto: number
}

// Añadir estas interfaces al inicio del archivo, después de las importaciones
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

/**
 * Genera y guarda un pagaré en formato PDF
 */
export const guardarPagare = async (
  numeroPagare: string,
  nombreDeudor: string,
  domicilioDeudor: string,
  ciDeudor: string,
  telefonoDeudor: string,
  montoTexto: string,
  monto: number,
  detallesPagos?: DetallePago[]
): Promise<void> => {
  try {
    // Formatear el monto
    const montoFormateado = new Intl.NumberFormat('es-PY', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'PYG'
    })
      .format(monto)
      .replace('PYG', 'Gs.')

    // Definir documento
    const docDefinition: DocumentDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 20, 40, 20],
      content: [
        // Encabezado
        {
          columns: [
            {
              width: '20%',
              text: `N° ${numeroPagare}`,
              style: 'numeroPagare'
            },
            {
              width: '50%',
              text: 'PAGARÉ A LA ORDEN',
              style: 'titulo'
            },
            {
              width: '30%',
              text: montoFormateado,
              style: 'montoHeader'
            }
          ]
        },
        // Campos principales
        {
          columns: [
            {
              text: 'VENCIMIENTO',
              style: 'campoTitulo'
            },
            {
              width: '80%',
              text: '_____________________________________________________________________________',
              style: 'campoValor'
            }
          ],
          margin: [0, 10, 0, 0]
        },
        {
          columns: [

            {
              text: 'EL DÍA DE',
              style: 'campoTitulo'
            },
            {
              width: '80%',
              text: '_____________________________________________________________________________',
              style: 'campoValor'
            }
          ],
            margin: [0, 10, 0, 0]
        },
        {
          columns: [
            {
              text: 'PAGARÉ A',
              style: 'campoTitulo'
            },
            {
              width: '80%',
              text: '_____________________________________________________________________________',
              style: 'campoValor'
            }
          ],
          margin: [0, 10, 0, 0]
        },
        {
          columns: [
            {
              text: 'O A SU ORDEN LA CANTIDAD DE GUARANÍES',
              style: 'campoTitulo'
            },
            {
              text: montoTexto,
              style: 'campoValor',
              bold: true

            }
          ],
          margin: [0, 10, 0, 0]
        },
        // Texto legal
        {
          text: `Por igual valor recibido en ____________ a mi (nuestra) entera satisfacción. Queda expresamente convenido que la falta de pago de este pagaré me (nos)constituirá en mora automática, sin necesidad de interpelación judicial o extrajudicial alguna, devengado durante el tiempo de la mora un interés del ____%, un interés moratorio del ____% y una comisión del ____% por el simple retardo sin que esto implique prórroga del plazo de la obligación. Asimismo, me (nos) obligamos a pagar cualquier gasto en que incurra el acreedor con relación al préstamo, en caso de que el mismo sea reclamado por la vía judicial o extrajudicial. El simple vencimiento establecerá la mora, automatizando a la inclusión a la base de datos de informconf y lo establecido en la Ley 1682/1969, como también para que se pueda proveer la información a terceros interesados. A los efectos legales y procesales a la jurisdicción de los tribunales de la ciudad de ____________, y renunciando a cualquier otra que pudiera corresponder. Las partes constituyen domicilio especial en los lugares indicados en el presente documento.`,
          style: 'parrafo',
          alignment: 'justify'
        },
        // Sección de firmas e información
        {
          columns: [
            {
              width: '45%',
              stack: [
                { text: `NOMBRE: ${nombreDeudor}`, style: 'infoPersona', bold: true },
                { text: `DOMICILIO: ${domicilioDeudor}`, style: 'infoPersona' },
                { text: `C.I.: ${ciDeudor}`, style: 'infoPersona' },
                { text: `N° DE TEL: ${telefonoDeudor}`, style: 'infoPersona' },
                { text: '', margin: [0, 30, 0, 0] },
                { text: '................................................', alignment: 'center' },
                { text: 'FIRMA DEUDOR', alignment: 'center', bold: true }
              ]
            },
            {
              width: '10%',
              text: ''
            },
            {
              width: '45%',
              stack: [
                { text: 'NOMBRE:', style: 'infoPersona', bold: true },
                { text: 'DOMICILIO:', style: 'infoPersona' },
                { text: 'C.I.:', style: 'infoPersona' },
                { text: 'N° DE TEL:', style: 'infoPersona' },
                { text: '', margin: [0, 30, 0, 0] },
                { text: '................................................', alignment: 'center' },
                { text: 'FIRMA CODEUDOR', alignment: 'center', bold: true }
              ]
            }
          ],
          margin: [0, 15, 0, 15]
        }
      ],
      styles: {
        titulo: {
          fontSize: 16,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        numeroPagare: {
          fontSize: 12,
          bold: true,
          color: 'red'
        },
        montoHeader: {
          fontSize: 14,
          bold: true,
          alignment: 'right'
        },
        campoTitulo: {
          fontSize: 11,
          bold: true
        },
        campoValor: {
          fontSize: 11
        },
        parrafo: {
          fontSize: 10,
          margin: [0, 10, 0, 20]
        },
        infoPersona: {
          fontSize: 11,
          margin: [0, 5, 0, 0]
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          alignment: 'center'
        }
      }
    }

    // Añadir tabla de cuotas si está disponible
    if (detallesPagos && detallesPagos.length > 0) {
      docDefinition.content.push({
        table: {
          headerRows: 1,
          widths: ['33%', '33%', '33%'],
          body: [
            [
              { text: 'CUOTA', style: 'tableHeader', alignment: 'center' },
              { text: 'VENCIMIENTO', style: 'tableHeader', alignment: 'center' },
              { text: 'MONTO', style: 'tableHeader', alignment: 'center' }
            ],
            ...detallesPagos.map((detalle) => [
              { text: `${detalle.numeroCuota}/${detallesPagos.length}`, alignment: 'center' },
              { text: detalle.fechaVencimiento, alignment: 'center' },
              {
                text: new Intl.NumberFormat('es-PY', {
                  maximumFractionDigits: 0,
                  style: 'currency',
                  currency: 'PYG'
                })
                  .format(detalle.monto)
                  .replace('PYG', 'Gs.'),
                alignment: 'right'
              }
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
        },
        margin: [0, 20, 0, 0]
      })
    }

    // Generar el PDF
    const pdfDocGenerator = pdfMake.createPdf(docDefinition as any)

    // Descargar el PDF
    pdfDocGenerator.download(`Pagare_${numeroPagare}.pdf`)

    return Promise.resolve()
  } catch (error) {
    console.error('Error al generar el pagaré:', error)
    return Promise.reject(error)
  }
}

export const previsualizarPagare = async (
  numeroPagare: string,
  nombreDeudor: string,
  domicilioDeudor: string,
  ciDeudor: string,
  telefonoDeudor: string,
  montoTexto: string,
  monto: number,
  detallesPagos?: DetallePago[]
): Promise<void> => {
  try {
    await guardarPagare(
      numeroPagare,
      nombreDeudor,
      domicilioDeudor,
      ciDeudor,
      telefonoDeudor,
      montoTexto,
      monto,
      detallesPagos
    )
    return Promise.resolve()
  } catch (error) {
    console.error('Error al previsualizar el pagaré:', error)
    return Promise.reject(error)
  }
}
