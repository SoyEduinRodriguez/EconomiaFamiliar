'use client';
import { useState } from 'react';
import { AlertCircle, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TransactionTable({ transacciones, onActionSuccess }) {
  const [loadingId, setLoadingId] = useState(null);

  // 🚫 Función para ANULAR lógicamente la transacción
  const handleAnular = async (id, estadoActual) => {
    if (!window.confirm('¿Estás seguro de que deseas anular este movimiento? Ya no sumará a los balances.')) return;
    setLoadingId(id);
    try {
      const nuevoEstado = estadoActual === 'anulado' ? 'activo' : 'anulado';
      const { error } = await supabase
        .from('transacciones')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  // 🗑️ Función para ELIMINAR físicamente de la base de datos
  const handleEliminar = async (id) => {
    if (!window.confirm('🚨 ¡ALERTA! Esto eliminará permanentemente el registro de la base de datos. ¿Continuar?')) return;
    setLoadingId(id);
    try {
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert('Error al eliminar la transacción: ' + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  if (!transacciones || transacciones.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-xs max-w-xl mx-auto my-4">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        No hay transacciones registradas en este periodo.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-xl mx-auto my-4">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-700 text-sm">Historial de Movimientos</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acciones</span>
      </div>
      
      <div className="p-4 divide-y divide-gray-100">
        {transacciones.map((tx) => {
          const isAnulado = tx.estado === 'anulado';
          
          return (
            <div 
              key={tx.id} 
              className={`py-3 flex justify-between items-center text-sm transition-opacity ${
                isAnulado ? 'opacity-40 bg-gray-50/50 px-2 rounded-xl' : ''
              }`}
            >
              {/* Información del movimiento */}
              <div className="space-y-0.5">
                <p className={`font-semibold text-gray-800 ${isAnulado ? 'line-through text-gray-400' : ''}`}>
                  {tx.descripcion || 'Sin detalle'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider bg-gray-100 px-1.5 py-0.5 rounded-md">
                    {tx.scope}
                  </span>
                  {isAnulado && (
                    <span className="text-[9px] text-red-500 font-bold uppercase bg-red-50 px-1 rounded-sm">
                      Anulado
                    </span>
                  )}
                </div>
              </div>

              {/* Monto y Botones de Acción */}
              <div className="flex items-center gap-4">
                <span className={`font-bold whitespace-nowrap ${
                  isAnulado 
                    ? 'text-gray-400 line-through font-medium' 
                    : tx.tipo_transaccion === 'ingreso' 
                      ? 'text-emerald-600' 
                      : 'text-gray-700'
                }`}>
                  {tx.tipo_transaccion === 'ingreso' ? '+' : '-'} ${parseFloat(tx.monto).toLocaleString('es-CO')}
                </span>

                {/* Bloque de botones discretos */}
                <div className="flex items-center gap-1 text-gray-400">
                  <button
                    disabled={loadingId === tx.id}
                    onClick={() => handleAnular(tx.id, tx.estado)}
                    title={isAnulado ? "Reactivar Transacción" : "Anular Transacción"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isAnulado 
                        ? 'hover:bg-emerald-50 hover:text-emerald-600 text-gray-300' 
                        : 'hover:bg-amber-50 hover:text-amber-600'
                    }`}
                  >
                    {isAnulado ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>
                  <button
                    disabled={loadingId === tx.id}
                    onClick={() => handleEliminar(tx.id)}
                    title="Eliminar permanentemente"
                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
