import  { useState } from 'react'
import { ListaPrestamos } from './ListaPrestamos'
import { FormularioPrestamo } from './FormularioPrestamos'
import { DetallesPrestamo } from './DetallesPrestamo'

type Vista = 'lista' | 'nuevo' | 'editar' | 'detalles'

export function Prestamos() {
  const [vista, setVista] = useState<Vista>('lista')
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState<number | undefined>()

  const verLista = () => {
    setVista('lista')
    setPrestamoSeleccionadoId(undefined)
  }

  const verNuevoPrestamo = () => {
    setVista('nuevo')
    setPrestamoSeleccionadoId(undefined)
  }

  const verDetalles = (id: number) => {
    setVista('detalles')
    setPrestamoSeleccionadoId(id)
  }

  const editarPrestamo = (id: number) => {
    setVista('editar')
    setPrestamoSeleccionadoId(id)
  }

  // Renderizar la vista actual
  switch (vista) {
    case 'lista':
      return (
        <ListaPrestamos 
          onNuevoClick={verNuevoPrestamo} 
          onVerPrestamo={verDetalles} 
          onEditarPrestamo={editarPrestamo} 
        />
      )
    case 'nuevo':
      return (
        <FormularioPrestamo 
          onCancel={verLista} 
          onSave={verLista} 
        />
      )
    case 'editar':
      return (
        <FormularioPrestamo 
          prestamoId={prestamoSeleccionadoId} 
          onCancel={() => verDetalles(prestamoSeleccionadoId!)} 
          onSave={() => verDetalles(prestamoSeleccionadoId!)} 
        />
      )
    case 'detalles':
      return (
        <DetallesPrestamo 
          prestamoId={prestamoSeleccionadoId!} 
          onBack={verLista} 
          onEdit={() => editarPrestamo(prestamoSeleccionadoId!)} 
        />
      )
    default:
      return <ListaPrestamos onNuevoClick={verNuevoPrestamo} onVerPrestamo={verDetalles} onEditarPrestamo={editarPrestamo} />
  }
}