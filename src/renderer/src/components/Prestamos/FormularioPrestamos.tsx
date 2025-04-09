import React, { useState, useEffect } from 'react'
import type { Prestamo } from '../../types/Prestamo'
import type { Cliente } from '../../types/Cliente'
import { guardarPagare, DetallePago } from '../../services/pdfGenerator'
import { numeroALetras } from '../../utils/formatoMoneda'

interface FormularioPrestamoProps {
  prestamoId?: number
  onSave: () => void
  onCancel: () => void
}

export function FormularioPrestamo({ prestamoId, onSave, onCancel }: FormularioPrestamoProps) {
  const [prestamo, setPrestamo] = useState<Partial<Prestamo>>({
    fecha_prestamo: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    cliente_id: 0,
    monto: 0,
    cantidad_cuotas: 1,
    interes: 0,
    intervalo_pago: 'mensual',
    estado: 'activo'
  })
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esEdicion = !!prestamoId

  // Cargar lista de clientes
  useEffect(() => {
    cargarClientes()
  }, [])

  // Cargar datos del préstamo en modo edición
  useEffect(() => {
    if (prestamoId) {
      cargarPrestamo(prestamoId)
    }
  }, [prestamoId])

  const cargarClientes = async () => {
    try {
      const data = await window.api.clientes.obtenerTodos()
      setClientes(data)
    } catch (err) {
      console.error('Error al cargar clientes:', err)
      setError('Error al cargar la lista de clientes')
    }
  }

  const cargarPrestamo = async (id: number) => {
    try {
      setCargando(true)
      const data = await window.api.prestamos.obtenerPorId(id)
      if (data) {
        // Formatear la fecha para el input date (YYYY-MM-DD)
        const fecha = new Date(data.fecha_prestamo)
        const fechaFormateada = fecha.toISOString().split('T')[0]

        setPrestamo({
          ...data,
          fecha_prestamo: fechaFormateada
        })
      } else {
        setError('No se encontró el préstamo')
      }
    } catch (err) {
      console.error('Error al cargar préstamo:', err)
      setError('Error al cargar los datos del préstamo')
    } finally {
      setCargando(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Convertir a número los campos numéricos
    if (['monto', 'cantidad_cuotas', 'interes', 'cliente_id'].includes(name)) {
      setPrestamo((prev) => ({ ...prev, [name]: Number(value) }))
    } else {
      setPrestamo((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setGuardando(true)
      setError(null)

      // Log para depuración - mostrar la fecha exacta que se está usando
      console.log('Fecha de inicio original:', prestamo.fecha_prestamo);
      
      // Validaciones básicas
      if (!prestamo.cliente_id || prestamo.cliente_id === 0) {
        throw new Error('Debe seleccionar un cliente')
      }

      if (!prestamo.monto || prestamo.monto <= 0) {
        throw new Error('El monto debe ser mayor a cero')
      }

      let prestamoGuardado: Prestamo;

      if (esEdicion) {
        await window.api.prestamos.actualizar(prestamo as Prestamo)
        prestamoGuardado = prestamo as Prestamo;
      } else {
        // Guardar el nuevo préstamo
        prestamoGuardado = await window.api.prestamos.crear(prestamo as Omit<Prestamo, 'id'>);
        
        // Obtener los datos del cliente para el pagaré
        const cliente = await window.api.clientes.obtenerPorId(prestamo.cliente_id);
        
        if (cliente && prestamoGuardado.id) {
          // Calcular fecha de vencimiento basada en la fecha de préstamo y el intervalo de pago
          const fechaPrestamo = new Date(prestamo.fecha_prestamo || new Date());
          let fechaVencimiento = new Date(fechaPrestamo);
          
          // Ajustar la fecha de vencimiento según el intervalo de pago
          switch (prestamo.intervalo_pago) {
            case 'diario':
              fechaVencimiento.setDate(fechaPrestamo.getDate() + 1);
              break;
            case 'semanal':
              fechaVencimiento.setDate(fechaPrestamo.getDate() + 7);
              break;
            case 'quincenal':
              fechaVencimiento.setDate(fechaPrestamo.getDate() + 15);
              break;
            case 'mensual':
            default:
              fechaVencimiento.setMonth(fechaPrestamo.getMonth() + 1);
              break;
          }
                
          // Calcular el monto con interés
          const montoOriginal = prestamo.monto;
          const interes = prestamo.interes || 0;
          const montoConInteres = montoOriginal + (montoOriginal * (interes / 100));
          const montoConInteresEnLetras = numeroALetras(montoConInteres);

          // Generar desglose de pagos
          console.log('Datos para generar pagos:', {
            fecha_prestamo: prestamo.fecha_prestamo,
            intervalo_pago: prestamo.intervalo_pago,
            cantidad_cuotas: prestamo.cantidad_cuotas,
            monto_total: montoConInteres
          });
          
          // Asegurar que la cantidad de cuotas sea al menos 1 y coincida con el valor en el formulario
          const cantidadCuotas = Math.max(1, prestamo.cantidad_cuotas || 1);
          
          // Verificar que la cantidad de cuotas sea correcta
          console.log('Cantidad de cuotas del préstamo:', cantidadCuotas);
          
          const detallesPagos = generarDetallePagos(
            prestamo.fecha_prestamo || new Date().toISOString().split('T')[0], 
            prestamo.intervalo_pago || 'mensual',
            cantidadCuotas,
            montoConInteres
          );
          
          console.log('Detalles de pagos generados:', detallesPagos);
          
          const montoEnLetras = numeroALetras(prestamo.monto);
          
          try {
            // Log para verificar los valores justo antes de llamar a guardarPagare
            console.log('Verificación final de valores para guardarPagare:', {
              monto: prestamo.monto,
              montoTexto: montoEnLetras,
              montoConInteres: montoConInteres,
              montoConInteresTexto: montoConInteresEnLetras,
              cuotas: detallesPagos.length,
              montoPrimeraCuota: detallesPagos[0].monto,
              sumaMontosCuotas: detallesPagos.reduce((sum, pago) => sum + pago.monto, 0)
            });
            
            // Generar y guardar el pagaré
            await guardarPagare(
              prestamoGuardado.id.toString(), // Usar el ID del préstamo como número de pagaré
              cliente.nombre,
              cliente.direccion || 'N/A',  
              cliente.ci,
              cliente.telefono || 'N/A',
              montoConInteresEnLetras,
              montoConInteres,
              detallesPagos
            );
            
            // Puedes mostrar un mensaje de éxito aquí si lo deseas
            // Por ejemplo, usando una biblioteca de notificaciones
          } catch (docError) {
            console.error('Error al generar el pagaré:', docError);
            // No bloquear el flujo principal si hay error al generar el pagaré
          }
        }
      }

      onSave()
    } catch (err: any) {
      console.error('Error al guardar préstamo:', err)
      setError(err.message || 'Error al guardar el préstamo')
    } finally {
      setGuardando(false)
    }
  }

  // Función para generar el detalle de pagos
  const generarDetallePagos = (
    fechaInicio: string,
    intervaloPago: string,
    cantidadCuotas: number,
    montoTotal: number
  ): DetallePago[] => {
    const detallesPagos: DetallePago[] = [];
    
    console.log(`Fecha de inicio recibida: ${fechaInicio}`);
    
    // SOLUCIÓN DIRECTA: Convertimos a Date añadiendo 1 día explícitamente para compensar
    let fechaBase = new Date(fechaInicio);
    fechaBase.setDate(fechaBase.getDate() + 1); // Compensamos agregando un día
    
    console.log(`Fecha base ajustada: ${fechaBase.toISOString()}`);
    
    // Asegurar que cantidadCuotas sea al menos 1
    const numCuotas = Math.max(1, cantidadCuotas || 1);
    
    // Asegurar que montoTotal sea positivo (este valor debe incluir ya el interés)
    const montoTotalSeguro = Math.max(1, montoTotal || 1);
    
    // Cálculo preciso del monto por cuota (el total CON INTERÉS dividido entre el número de cuotas)
    // Redondeamos para evitar problemas con decimales
    const montoPorCuota = Math.round(montoTotalSeguro / numCuotas);
    
    // Calcular suma total para asegurar que coincida exactamente con montoTotal
    const sumaTotalCalculada = montoPorCuota * numCuotas;
    
    // Verificar si hay diferencia por el redondeo
    const diferencia = montoTotalSeguro - sumaTotalCalculada;
    
    // Generar cada cuota
    for (let i = 0; i < numCuotas; i++) {
      // Crear una nueva fecha para cada cuota
      let fechaCuota = new Date(fechaBase);
      
      // Calcular la fecha de vencimiento según el intervalo
      switch (intervaloPago) {
        case 'diario':
          fechaCuota.setDate(fechaBase.getDate() + i);
          break;
        case 'semanal':
          fechaCuota.setDate(fechaBase.getDate() + (i * 7));
          break;
        case 'quincenal':
          fechaCuota.setDate(fechaBase.getDate() + (i * 15));
          break;
        case 'mensual':
        default:
          // Para el caso mensual, no usamos los componentes extraídos, sino que
          // trabajamos directamente con la fecha base ajustada
          fechaCuota = new Date(fechaBase);
          fechaCuota.setMonth(fechaBase.getMonth() + i);
          break;
      }
      
      console.log(`Cuota ${i+1}: Fecha calculada: ${fechaCuota.toISOString()}`);
      
      // Formatear la fecha para mostrar (DD/MM/YYYY)
      // Para evitar problemas de zona horaria al formatear, extraemos los componentes
      // directamente de la fecha en formato ISO (UTC)
      const fechaISO = fechaCuota.toISOString(); // Formato: YYYY-MM-DDTHH:MM:SS.sssZ
      const [fechaParte] = fechaISO.split('T'); // Obtenemos solo la parte de la fecha: YYYY-MM-DD
      const [anioStr, mesStr, diaStr] = fechaParte.split('-'); // Separamos en componentes
      
      const fechaFormateada = `${diaStr}/${mesStr}/${anioStr}`;
      
      console.log(`Cuota ${i+1}: Fecha formateada final: ${fechaFormateada}`);
      
      // Para la última cuota, ajustar el monto si hay diferencia por redondeo
      let montoAjustado = montoPorCuota;
      if (i === numCuotas - 1 && diferencia !== 0) {
        montoAjustado = montoPorCuota + diferencia;
        console.log(`Ajustando última cuota: ${montoPorCuota} + ${diferencia} = ${montoAjustado}`);
      }
      
      // Añadir el detalle de esta cuota
      detallesPagos.push({
        numeroCuota: i + 1,
        fechaVencimiento: fechaFormateada,
        monto: montoAjustado // Usar el monto ajustado
      });
    }
    
    // Verificar que se haya generado al menos una cuota
    if (detallesPagos.length === 0) {
      // Si por alguna razón no se generó ninguna cuota, crear una por defecto
      const fechaVencimiento = new Date(fechaBase);
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
      
      // Formatear la fecha para mostrar (DD/MM/YYYY) usando el mismo método consistente
      const fechaISO = fechaVencimiento.toISOString();
      const [fechaParte] = fechaISO.split('T');
      const [anioStr, mesStr, diaStr] = fechaParte.split('-');
      
      const fechaFormateada = `${diaStr}/${mesStr}/${anioStr}`;
      
      detallesPagos.push({
        numeroCuota: 1,
        fechaVencimiento: fechaFormateada,
        monto: Math.round(montoTotalSeguro)
      });
      
      console.warn('No se generaron cuotas con los parámetros proporcionados. Se ha creado una cuota por defecto.');
    }
    
    return detallesPagos;
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">
          {esEdicion ? 'Editar Préstamo' : 'Nuevo Préstamo'}
        </h2>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha del Préstamo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Préstamo *
              </label>
              <input
                type="date"
                name="fecha_prestamo"
                value={prestamo.fecha_prestamo || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                name="cliente_id"
                value={prestamo.cliente_id || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} - CI: {cliente.ci}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto del Préstamo *
              </label>
              <input
                type="number"
                name="monto"
                value={prestamo.monto || ''}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Interés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interés (%) *</label>
              <input
                type="number"
                name="interes"
                value={prestamo.interes || ''}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cantidad de Cuotas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad de Cuotas *
              </label>
              <input
                type="number"
                name="cantidad_cuotas"
                value={prestamo.cantidad_cuotas || ''}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Intervalo de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo de Pago *
              </label>
              <select
                name="intervalo_pago"
                value={prestamo.intervalo_pago || 'mensual'}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select
                name="estado"
                value={prestamo.estado || 'activo'}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="activo">Activo</option>
                <option value="pagado">Pagado</option>
                <option value="mora">En mora</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
