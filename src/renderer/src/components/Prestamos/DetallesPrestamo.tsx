import  { useEffect, useState } from 'react'
import type { Prestamo } from '../../types/Prestamo'
import type { Pago } from '../../types/Pago'
import { useNotification } from '../../hooks/useNotification'
import { Notification } from '../UI/Notification'
import { guardarPagare, DetallePago } from '../../services/pdfGenerator'
import { numeroALetras } from '@renderer/utils/formatoMoneda'

interface DetallesPrestamoProps {
  prestamoId: number
  onBack: () => void
  onEdit: () => void
}

export function DetallesPrestamo({ prestamoId, onBack, onEdit }: DetallesPrestamoProps) {
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [montoPagado, setMontoPagado] = useState(0)
  const [saldoPendiente, setSaldoPendiente] = useState(0)
  
  // Estados para el formulario de pago
  const [montoPago, setMontoPago] = useState('')
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cargandoPago, setCargandoPago] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [errorPago, setErrorPago] = useState<string | null>(null)

  const { notification, hideNotification } = useNotification()

  const [generandoDocumento, setGenerandoDocumento] = useState(false)

  useEffect(() => {
    cargarPrestamo()
  }, [prestamoId])

  const cargarPrestamo = async () => {
    try {
      setCargando(true)
      const data = await window.api.prestamos.obtenerPorId(prestamoId)
      setPrestamo(data)
      
      // Cargar los pagos
      await cargarPagos()
    } catch (err) {
      console.error('Error al cargar préstamo:', err)
      setError('No se pudo cargar la información del préstamo')
    } finally {
      setCargando(false)
    }
  }

  const cargarPagos = async () => {
    try {
      // Verificar si la API está disponible
      if (window.api.pagos && window.api.pagos.obtenerPorPrestamo) {
        const pagosList = await window.api.pagos.obtenerPorPrestamo(prestamoId)
        setPagos(pagosList)
        
        // Calcular monto pagado
        const totalPagado = pagosList.reduce((total, pago) => total + pago.monto, 0)
        setMontoPagado(totalPagado)
        
        // Calcular saldo pendiente
        if (prestamo) {
          const montoTotal = prestamo.monto + (prestamo.monto * prestamo.interes) / 100
          setSaldoPendiente(montoTotal - totalPagado)
        }
      } else {
        console.log('La API de pagos aún no está disponible')
        setPagos([])
        setMontoPagado(0)
        if (prestamo) {
          setSaldoPendiente(calcularMontoTotal())
        }
      }
    } catch (err) {
      console.error('Error al cargar pagos:', err)
      setPagos([])
      setMontoPagado(0)
      if (prestamo) {
        setSaldoPendiente(calcularMontoTotal())
      }
    }
  }

  const handleSubmitPago = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorPago(null)
    setMensajeExito(null)
    
    if (!prestamo) {
      setErrorPago("No se pudo cargar el préstamo")
      return
    }
    
    try {
      setCargandoPago(true)
      
      // Calcular el saldo pendiente actual
      const pagosActuales = await window.api.pagos.obtenerPorPrestamo(prestamoId)
      const montoPagado = pagosActuales.reduce((total, pago) => total + pago.monto, 0)
      const montoTotal = calcularMontoTotal()
      const saldoPendiente = montoTotal - montoPagado
      
      // Si el saldo pendiente es cero o negativo, el préstamo ya está pagado
      if (saldoPendiente <= 0) {
        setErrorPago("Este préstamo ya ha sido pagado completamente")
        setCargandoPago(false)
        return
      }
      
      // Determinar el monto a utilizar
      let montoAUtilizar = !montoPago || parseFloat(montoPago) <= 0 
        ? Math.min(calcularMontoCuota(), saldoPendiente)
        : parseFloat(montoPago)
      
      // Si el monto excede el saldo pendiente, ajustarlo automáticamente
      if (montoAUtilizar > saldoPendiente) {
        montoAUtilizar = saldoPendiente
      }
      
      // Registrar el pago
      await window.api.pagos.crear({
        prestamo_id: prestamoId,
        fecha_pago: fechaPago || new Date().toISOString().split('T')[0],
        monto: montoAUtilizar
      })
      
      // Verificar si con este pago se cancela el préstamo
      const nuevoPagado = montoPagado + montoAUtilizar
      const estaPagadoCompleto = nuevoPagado >= montoTotal
      
      // Si se pagó completamente, actualizar automáticamente el estado del préstamo
      if (estaPagadoCompleto && prestamo.estado !== 'pagado') {
        const prestamoActualizado = { ...prestamo, estado: 'pagado' }
        await window.api.prestamos.actualizar(prestamoActualizado)
        setMensajeExito(`¡Préstamo pagado completamente! Se registró un pago de ${formatearMonto(montoAUtilizar)}`)
      } else {
        setMensajeExito(`Pago de ${formatearMonto(montoAUtilizar)} registrado correctamente. Saldo pendiente: ${formatearMonto(saldoPendiente - montoAUtilizar)}`)
      }
      
      // Limpiar y actualizar datos
      setMontoPago('')
      setFechaPago(new Date().toISOString().split('T')[0])
      setMostrarFormulario(false)
      await cargarPagos()
      await cargarPrestamo()
      
    } catch (error) {
      console.error('Error al registrar pago:', error)
      setErrorPago(`Error al registrar el pago: ${error}`)
    } finally {
      setCargandoPago(false)
    }
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(monto)
  }

  // Calcular el monto total (capital + interés)
  const calcularMontoTotal = () => {
    if (!prestamo) return 0
    return prestamo.monto + (prestamo.monto * prestamo.interes) / 100
  }

  // Calcular el monto de cada cuota
  const calcularMontoCuota = () => {
    if (!prestamo || prestamo.cantidad_cuotas === 0) return 0
    return calcularMontoTotal() / prestamo.cantidad_cuotas
  }

  // Función para formatear fecha en formato DD/MM/YYYY
  const formatearFecha = (fecha: string): string => {
    // Corregir el problema de zona horaria al formatear la fecha
    try {
      // Si la fecha tiene formato YYYY-MM-DD
      if (fecha.includes('-')) {
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return `${dia}/${mes}/${anio}`;
      } 
      // Si ya está en formato DD/MM/YYYY
      else if (fecha.includes('/')) {
        return fecha;
      }
      // Fallback al método anterior
      const date = new Date(fecha);
      return `${date.getDate().toString().padStart(2, '0')}/${
        (date.getMonth() + 1).toString().padStart(2, '0')}/${
        date.getFullYear()}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fecha; // Devolver la fecha original si hay error
    }
  };

  const generarDocumentoPagare = async () => {
    if (prestamo && prestamo.cliente) {
      try {
        setGenerandoDocumento(true);
        console.log('Iniciando generación de pagaré para préstamo:', prestamo.id);
        console.log('Datos del préstamo:', { 
          id: prestamo.id,
          monto: prestamo.monto,
          cantidad_cuotas: prestamo.cantidad_cuotas,
          intervalo_pago: prestamo.intervalo_pago,
          fecha_prestamo: prestamo.fecha_prestamo,
        });
        
        // Crear detalles de pago con validación adicional
        const detallesPagos: DetallePago[] = [];
        const cantidadCuotasRequeridas = parseInt(prestamo.cantidad_cuotas.toString());
        
        if (isNaN(cantidadCuotasRequeridas) || cantidadCuotasRequeridas <= 0) {
          console.error('Cantidad de cuotas inválida:', prestamo.cantidad_cuotas);
          alert('Error: La cantidad de cuotas es inválida. Por favor, verifique los datos del préstamo.');
          setGenerandoDocumento(false);
          return;
        }
        
        console.log(`Generando ${cantidadCuotasRequeridas} cuotas para el préstamo...`);
        
        // Calcular la fecha de inicio (fecha del préstamo)
        const fechaInicio = new Date(prestamo.fecha_prestamo);
        
        // Crear cada cuota
        for (let i = 0; i < cantidadCuotasRequeridas; i++) {
          const fechaCuota = new Date(fechaInicio);
          
          // Calcular fecha de vencimiento según intervalo de pago
          switch (prestamo.intervalo_pago) {
            case 'diario':
              fechaCuota.setDate(fechaInicio.getDate() + (i + 1));
              break;
            case 'semanal':
              fechaCuota.setDate(fechaInicio.getDate() + ((i + 1) * 7));
              break;
            case 'quincenal':
              fechaCuota.setDate(fechaInicio.getDate() + ((i + 1) * 15));
              break;
            case 'mensual':
            default:
              fechaCuota.setMonth(fechaInicio.getMonth() + (i + 1));
              break;
          }
          
          // Formatear fecha (DD/MM/YYYY)
          const fechaFormateada = 
            `${fechaCuota.getDate().toString().padStart(2, '0')}/${
             (fechaCuota.getMonth() + 1).toString().padStart(2, '0')}/${
             fechaCuota.getFullYear()}`;
          
          // Calcular monto por cuota
          const montoTotal = calcularMontoTotal();
          const montoPorCuota = Math.round(montoTotal / cantidadCuotasRequeridas);
          
          // Ajustar última cuota si hay diferencia por redondeo
          let montoAjustado = montoPorCuota;
          if (i === cantidadCuotasRequeridas - 1) {
            const sumaParcial = montoPorCuota * (cantidadCuotasRequeridas - 1);
            montoAjustado = montoTotal - sumaParcial;
          }
          
          // Añadir cuota al array
          detallesPagos.push({
            numeroCuota: i + 1,
            fechaVencimiento: fechaFormateada,
            monto: montoAjustado
          });
          
          console.log(`Cuota ${i+1}/${cantidadCuotasRequeridas} generada: ${fechaFormateada} - ${montoAjustado}`);
        }
        
        // Verificación final de la cantidad de cuotas
        if (detallesPagos.length !== cantidadCuotasRequeridas) {
          console.error(`ERROR: Se esperaban ${cantidadCuotasRequeridas} cuotas, pero se generaron ${detallesPagos.length}`);
          alert(`Error: No se pudieron generar todas las cuotas. Se esperaban ${cantidadCuotasRequeridas}, pero se generaron ${detallesPagos.length}`);
          setGenerandoDocumento(false);
          return;
        }
        
        console.log(`Detalles de pagos generados (${detallesPagos.length} cuotas):`, detallesPagos);
        
        // Generar texto para montos usando la función importada
        const montoTexto = numeroALetras(prestamo.monto);
        const montoConInteresTexto = numeroALetras(calcularMontoTotal());
        
        console.log('Textos generados:');
        console.log(`- Monto original: ${prestamo.monto} => "${montoTexto}"`);
        console.log(`- Monto con interés: ${calcularMontoTotal()} => "${montoConInteresTexto}"`);
        
        // Valores a enviar a generarPagare
        const datosParaPagare = {
          numeroPagare: prestamo.id?.toString() || '0',
          monto: prestamo.monto,
          montoTexto,
          montoConInteres: calcularMontoTotal(),
          montoConInteresTexto,
          fechaVencimiento: formatearFecha(prestamo.fecha_prestamo),
          nombreDeudor: prestamo.cliente.nombre,
          domicilioDeudor: prestamo.cliente.direccion || 'N/A',
          ciDeudor: prestamo.cliente.ci,
          telefonoDeudor: prestamo.cliente.telefono || 'N/A',
          detallesPagos
        };
        
        console.log('Llamando a generarPagare con datos:', datosParaPagare);
        
        // Llamar al servicio importado
        try {
          await guardarPagare(
            datosParaPagare.numeroPagare,
            datosParaPagare.nombreDeudor,
            datosParaPagare.domicilioDeudor,
            datosParaPagare.ciDeudor,
            datosParaPagare.telefonoDeudor,
            datosParaPagare.montoConInteresTexto,
            datosParaPagare.montoConInteres,
            datosParaPagare.detallesPagos
          );
          console.log('Pagaré generado con éxito');
        } catch (docError) {
          console.error('Error específico al generar el documento:', docError);
          alert(`Error al generar el documento: ${docError instanceof Error ? docError.message : 'Error desconocido'}`);
        }
      } catch (error) {
        console.error('Error general al generar pagaré:', error);
        alert(`Error al generar el pagaré: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setGenerandoDocumento(false)
      }
    } else {
      alert('No se puede generar el pagaré. Faltan datos del préstamo o cliente.');
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={onBack}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
        >
          Volver a la lista
        </button>
      </div>
    )
  }

  if (!prestamo) {
    return (
      <div className="p-6">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No se encontró el préstamo</p>
        </div>
        <div className="mt-4">
          <button
            onClick={onBack}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Detalles del Préstamo</h2>
          <div className="space-x-2">
            <button
              onClick={generarDocumentoPagare}
              disabled={generandoDocumento}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:bg-blue-400"
            >
              {generandoDocumento ? 'Generando...' : 'Generar Pagaré'}
            </button>
            <button
              onClick={onEdit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
            >
              Editar
            </button>
            <button
              onClick={onBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Información del Préstamo</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 block">Fecha del préstamo:</span>
                <span className="font-medium">{formatearFecha(prestamo.fecha_prestamo)}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Monto del préstamo:</span>
                <span className="font-medium">{formatearMonto(prestamo.monto)}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Interés:</span>
                <span className="font-medium">{prestamo.interes}%</span>
              </div>
              <div>
                <span className="text-gray-600 block">Monto total a pagar:</span>
                <span className="font-medium">{formatearMonto(calcularMontoTotal())}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Cantidad de cuotas:</span>
                <span className="font-medium">{prestamo.cantidad_cuotas}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Valor de cada cuota:</span>
                <span className="font-medium">{formatearMonto(calcularMontoCuota())}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Intervalo de pago:</span>
                <span className="font-medium capitalize">{prestamo.intervalo_pago}</span>
              </div>
              <div>
                <span className="text-gray-600 block">Estado del préstamo:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${
                    prestamo.estado === 'activo'
                      ? 'bg-green-100 text-green-800'
                      : prestamo.estado === 'pagado'
                        ? 'bg-blue-100 text-blue-800'
                        : prestamo.estado === 'mora'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {prestamo.estado}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
            {prestamo.cliente ? (
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 block">Nombre:</span>
                  <span className="font-medium">{prestamo.cliente.nombre}</span>
                </div>
                {prestamo.cliente.ci && (
                  <div>
                    <span className="text-gray-600 block">CI:</span>
                    <span className="font-medium">{prestamo.cliente.ci}</span>
                  </div>
                )}
                {prestamo.cliente.telefono && (
                  <div>
                    <span className="text-gray-600 block">Teléfono:</span>
                    <span className="font-medium">{prestamo.cliente.telefono}</span>
                  </div>
                )}
                <div className="mt-4">
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      // Aquí podrías implementar la navegación a los detalles del cliente
                      alert('Navegación a detalles del cliente no implementada')
                    }}
                  >
                    Ver detalles completos del cliente
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                Cliente ID: {prestamo.cliente_id} (información no disponible)
              </p>
            )}
          </div>
        </div>

        {/* Sección de pagos */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Historial de Pagos</h3>
            {window.api.pagos ? (
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                {mostrarFormulario ? 'Cancelar' : 'Registrar Pago'}
              </button>
            ) : (
              <span className="text-yellow-600 text-sm">Funcionalidad en desarrollo</span>
            )}
          </div>

          {/* Resumen de pagos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <span className="text-sm text-gray-600 block">Monto total:</span>
              <span className="font-bold text-lg">{formatearMonto(calcularMontoTotal())}</span>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <span className="text-sm text-gray-600 block">Pagado:</span>
              <span className="font-bold text-lg">{formatearMonto(montoPagado)}</span>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <span className="text-sm text-gray-600 block">Pendiente:</span>
              <span className="font-bold text-lg">{formatearMonto(saldoPendiente)}</span>
            </div>
          </div>

          {/* Formulario de pago */}
          {mostrarFormulario && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium mb-3">Registrar nuevo pago</h4>

              {errorPago && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-3">
                  <p>{errorPago}</p>
                </div>
              )}

              {mensajeExito && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-3">
                  <p>{mensajeExito}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmitPago}
                className="mt-2 grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-4"
              >
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto del pago
                    <span className="ml-1 text-sm text-gray-500">
                      (Cuota sugerida: {formatearMonto(calcularMontoCuota())})
                    </span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    placeholder={calcularMontoCuota().toFixed(2)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                    step="any"
                  />
                  {saldoPendiente > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Saldo pendiente: {formatearMonto(saldoPendiente)}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="fechaPago" className="block text-sm font-medium text-gray-700">
                    Fecha de pago
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="fechaPago"
                      name="fechaPago"
                      value={fechaPago}
                      onChange={(e) => setFechaPago(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <button
                    type="submit"
                    disabled={cargandoPago}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {cargandoPago ? 'Registrando...' : 'Registrar Pago'}
                  </button>
                </div>

                {errorPago && <div className="sm:col-span-6 text-red-600 text-sm">{errorPago}</div>}

                {mensajeExito && (
                  <div className="sm:col-span-6 text-green-600 text-sm">{mensajeExito}</div>
                )}
              </form>
            </div>
          )}

          {/* Tabla de pagos */}
          {pagos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatearFecha(pago.fecha_pago)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatearMonto(pago.monto)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={async () => {
                            if (window.confirm('¿Está seguro que desea eliminar este pago?')) {
                              try {
                                // Verificar si la API está disponible
                                if (
                                  window.api.pagos &&
                                  window.api.pagos.eliminar
                                ) {
                                  await window.api.pagos.eliminar(pago.id!)
                                  await cargarPagos()
                                  await cargarPrestamo()
                                } else {
                                  alert(
                                    'La funcionalidad para eliminar pagos aún no está disponible'
                                  )
                                }
                              } catch (err) {
                                console.error('Error al eliminar pago:', err)
                                alert('Ocurrió un error al eliminar el pago')
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No hay pagos registrados para este préstamo.
            </p>
          )}
        </div>
      </div>
      
      {/* Mostrar notificación cuando sea necesario */}
      {notification.visible && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
    </div>
  )
}
