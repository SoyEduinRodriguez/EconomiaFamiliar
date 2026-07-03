'use client';
import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

export default function TransactionTable({ transacciones, onActionSuccess }) {
  const { updateTransaction, annulTransaction, loading } = useTransactions();
  
  // Estados para controlar qué fila se está editando
  const [editingId, setEditingId] = useState(null);
  const [montoEditado, setMontoEditado] = useState('');
  const [descripcionEditada, setDescripcionEditada] = useState('');

  // Activar el modo edición para una fila concreta
  const iniciarEdicion = (tx) => {
    setEditingId(tx.id);
    setMontoEditado(tx.monto);
    setDescripcionEditada(tx.descripcion);
  };

  // Guardar la edición del registro
  const handleGuardarEdicion = async (tx) => {
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
      if (onActionSuccess) onActionSuccess(); // Recargar datos en el dashboard
    }
  };

  // Anular la transacción de forma lógica (sin borrar de la BD por auditoría)
  const handleAnularTransaccion = async (id) => {
    const confirmar = confirm('¿Estás seguro de que deseas ANULAR este movimiento? Esto reversará los saldos y metas vinculadas.');
    if (!confirmar) return;

    const success = await annulTransaction(id);
    if (success && onActionSuccess) {
      onActionSuccess();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-50">
        <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">Historial de Movimientos</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
              <th className="p-4">Detalle / Categoría</th>
              <th className="p-4">Ámbito</th>
              <th className="p-4">Valor</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {transacciones && transacciones.map((tx) => {
              const esAnulado = tx.estado === 'anulado';
              const esIngreso = tx.tipo_transaccion === 'ingreso';
              const estaEditando = editingId === tx.id;

              return (
                <tr key={tx.id} className={`transition-colors ${esAnulado ? 'bg-gray-50/50 opacity-50' : 'hover:bg-gray-50/30'}`}>
                  
                  {/* Categoría y Detalle */}
                  <td className="p-4">
                    <div className="flex flex-col">
                      {estaEditando ? (
                        <input
                          type="text"
                          value={descripcionEditada}
                          onChange={(e) => setDescripcionEditada(e.target.value)}
                          className="p-1.5 text-xs border rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                          placeholder="Editar descripción..."
                        />
                      ) : (
                        <span className={`font-semibold ${esAnulado ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {tx.descripcion || tx.categorias?.nombre || 'Movimiento sin detalle'}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {tx.categorias?.nombre} • {tx.fecha_transaccion}
                      </span>
                    </div>
                  </td>

                  {/* Ámbito (Eduin, Majo o Hogar) */}
                  <td className="p-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      tx.scope === 'hogar' ? 'bg-emerald-50 text-emerald-600' :
                      tx.scope === 'eduin' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                    }`}>
                      {tx.scope}
                    </span>
                  </td>

                  {/* Valor Monetario */}
                  <td className="p-4 font-bold">
                    {estaEditando ? (
                      <input
                        type="number"
                        value={montoEditado}
                        onChange={(e) => setMontoEditado(e.target.value)}
                        className="p-1.5 text-xs border rounded-lg bg-gray-50 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                      />
                    ) : (
                      <span className={esAnulado ? 'line-through text-gray-400' : esIngreso ? 'text-emerald-600' : 'text-red-500'}>
                        {esIngreso ? '+' : '-'} ${parseFloat(tx.monto).toLocaleString('es-CO')}
                      </span>
                    )}
                  </td>

                  {/* Botones de Control (Modificar / Anular) */}
                  <td className="p-4 text-center">
                    {esAnulado ? (
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Anulado
                      </span>
                    ) : estaEditando ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleGuardarEdicion(tx)}
                          disabled={loading}
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Confirmar cambios"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => iniciarEdicion(tx)}
                          className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Modificar registro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAnularTransaccion(tx.id)}
                          className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
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

            {(!transacciones || transacciones.length === 0) && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-xs text-gray-400">
                  No hay transacciones registradas en este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
