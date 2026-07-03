'use client';
import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { Edit2, Trash2, XCircle, Check, AlertCircle } from 'lucide-react';

export default function TransactionTable({ transacciones, onActionSuccess }) {
  const { updateTransaction, annulTransaction, loading } = useTransactions();
  
  // Estados para manejar la edición en línea de un registro
  const [editingId, setEditingId] = useState(null);
  const [montoEditado, setMontoEditado] = useState('');
  const [descripcionEditada, setDescripcionEditada] = useState('');

  // Activar el modo edición guardando los valores actuales en el estado temporal
  const iniciarEdicion = (tx) => {
    setEditingId(tx.id);
    setMontoEditado(tx.monto);
    setDescripcionEditada(tx.descripcion);
  };

  // Cancelar edición limpia los estados
  const cancelarEdicion = () => {
    setEditingId(null);
    setMontoEditado('');
    setDescripcionEditada('');
  };

  // Guardar los cambios modificados
  const guardarEdicion = async (tx) => {
    if (!montoEditado || parseFloat(montoEditado) <= 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }

    const success = await updateTransaction(tx.id, {
      monto: montoEditado,
      descripcion: descripcionEditada,
      categoriaId: tx.categoria_id,
      cuentaId: tx.cuenta_id,
      fecha: tx.fecha_transaccion
    });

    if (success) {
      setEditingId(null);
      alert('¡Registro modificado con éxito! 🔄');
      if (onActionSuccess) onActionSuccess(); // Recargar datos en la vista principal
    }
  };

  // Anular la transacción de forma segura (No se borra de la DB, cambia estado)
  const manejarAnulacion = async (id) => {
    const confirmar = confirm('¿Estás seguro de que deseas anular este movimiento? Esto recalculará los balances e historiales.');
    if (!confirmar) return;

    const success = await annulTransaction(id);
    if (success) {
      alert('Movimiento anulado correctamente. 🛑');
      if (onActionSuccess) onActionSuccess();
    }
  };

  if (!transacciones || transacciones.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400 bg-white rounded-2xl border border-gray-100">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        No hay transacciones registradas en este periodo.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <h3 className="font-bold text-gray-700 text-sm">Historial de Movimientos</h3>
      </div>
      
      {/* Contenedor responsivo para tablas en móvil */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase text-gray-400">
              <th className="p-4">Detalle / Descripción</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Valor</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transacciones.map((tx) => {
              const esInactivo = tx.estado === 'anulado';
              const estaEditando = editingId === tx.id;

              return (
                <tr 
                  key={tx.id} 
                  className={`transition-colors ${esInactivo ? 'bg-gray-50/70 text-gray-400 line-through' : 'hover:bg-gray-50/40 text-gray-700'}`}
                >
                  {/* Celda Detalle */}
                  <td className="p-4">
                    {estaEditando ? (
                      <input
                        type="text"
                        value={descripcionEditada}
                        onChange={(e) => setDescripcionEditada(e.target.value)}
                        className="p-1.5 border rounded-lg w-full text-xs"
                      />
                    ) : (
                      <div>
                        <p className="font-semibold">{tx.descripcion || 'Sin descripción'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {tx.fecha_transaccion} • Por: <span className="uppercase font-bold">{tx.scope}</span>
                        </p>
                      </div>
                    )}
                  </td>

                  {/* Celda Categoría */}
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {tx.categorias?.nombre || 'General'}
                    </span>
                  </td>

                  {/* Celda Monto */}
                  <td className="p-4 font-bold">
                    {estaEditando ? (
                      <input
                        type="number"
                        value={montoEditado}
                        onChange={(e) => setMontoEditado(e.target.value)}
                        className="p-1.5 border rounded-lg w-28 text-xs font-bold"
                      />
                    ) : (
                      <span className={tx.tipo_transaccion === 'ingreso' ? 'text-emerald-600' : 'text-gray-700'}>
                        {tx.tipo_transaccion === 'ingreso' ? '+' : '-'} ${parseFloat(tx.monto).toLocaleString('es-CO')}
                      </span>
                    )}
                  </td>

                  {/* Celda Acciones CRUD */}
                  <td className="p-4 text-center">
                    {esInactivo ? (
                      <span className="text-[10px] uppercase font-black tracking-wider bg-red-50 text-red-500 px-2 py-0.5 rounded-md">Anulado</span>
                    ) : estaEditando ? (
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => guardarEdicion(tx)} 
                          disabled={loading}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm"
                          title="Guardar cambios"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={cancelarEdicion}
                          className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg"
                          title="Cancelar"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => iniciarEdicion(tx)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modificar valor o detalle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => manejarAnulacion(tx.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Anular movimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
