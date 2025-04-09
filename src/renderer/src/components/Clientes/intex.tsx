import { useState } from 'react'
import { ListaClientes } from './ListaClientes'
import { FormularioCliente } from './FormularioCliente'
import { DetallesCliente } from './DetallesCliente'





type Vista = 'lista' | 'nuevo' | 'editar' | 'detalles'

export function Clientes() {
  const [vista, setVista] = useState<Vista>('lista')
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<number | undefined>()
  

  const verLista = () => {
    setVista('lista')
    setClienteSeleccionadoId(undefined)
  }

  const verNuevoCliente = () => {
    setVista('nuevo')
    setClienteSeleccionadoId(undefined)
  }

  const verDetalles = (id: number) => {
    setVista('detalles')
    setClienteSeleccionadoId(id)
  }

  const editarCliente = (id: number) => {
    setVista('editar')
    setClienteSeleccionadoId(id)
  }

  // Renderizar la vista actual
  switch (vista) {
    case 'lista':
      return (
        <ListaClientes
          onNuevoClick={verNuevoCliente}
          onVerCliente={verDetalles}
          onEditarCliente={editarCliente}
        />
      )
    case 'nuevo':
      return <FormularioCliente onCancel={verLista} onSave={verLista} />
    case 'editar':
      return (
        <FormularioCliente
          clienteId={clienteSeleccionadoId}
          onCancel={() => verDetalles(clienteSeleccionadoId!)}
          onSave={() => verDetalles(clienteSeleccionadoId!)}
        />
      )
    case 'detalles':
      return (
        <DetallesCliente
          clienteId={clienteSeleccionadoId!}
          onBack={verLista}
          onEdit={() => editarCliente(clienteSeleccionadoId!)}
        />
      )
    default:
      return (
        <ListaClientes
          onNuevoClick={verNuevoCliente}
          onVerCliente={verDetalles}
          onEditarCliente={editarCliente}
        />
      )
  }
}
