'use client';
import { useState } from 'react';
import { AlertCircle, Trash2, Ban, CheckCircle2, Pencil, X, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TransactionTable({ transacciones, onActionSuccess }) {
  const [loadingId, setLoadingId] = useState(null);
  
  // Estados para el flujo de EDICIÓN
  const [editingTx, setEditingTx] = useState(null);
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // 🚫 Función para ANULAR
  const handleAnular = async (id, estadoActual) => {
    if (!window.confirm('¿Estás seguro de que deseas cambiar el estado de este movimiento?')) return;
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
      alert('Error: ' + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  // 🗑️ Función para ELIMINAR
  const handleEliminar = async (id) => {
    if (!window.confirm('🚨 ¡ALERTA! Esto eliminará permanentemente el registro. ¿Continuar?')) return;
    setLoadingId(id);
    try {
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  // ✏️ Abrir el modal de edición precargando los datos
  const iniciarEdicion = (tx) => {
    setEditingTx(tx);
    setNuevaDescripcion(tx.descripcion || '');
    setNuevoMonto(tx.monto);
  };

  // 💾 Guardar los datos modificados en Supabase
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editingTx || !nuevoMonto) return;
    setGuardandoEdicion(true);

    try {
      const { error } = await supabase
        .from('transacciones')
        .update({
          descripcion: nuevaDescripcion,
          monto: parseFloat(nuevoMonto)
        })
        .eq('id', editingTx.id);

      if (error) throw error;

      setEditingTx(null);
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert('Error al actualizar los datos: ' + err.message);
    } finally {
      setGuardandoEdicion(false);
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

              <div className="flex items-center gap-3">
                <span className={`font-bold whitespace-nowrap ${
                  isAnulado 
                    ? 'text-gray-400 line-through font-medium' 
                    : tx.tipo_transaccion === 'ingreso' 
                      ? 'text-emerald-600' 
                      : 'text-gray-700'
                }`}>
                  {tx.tipo_transaccion === 'ingreso' ? '+' : '-'} ${parseFloat(tx.monto).toLocaleString('es-CO')}
                </span>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex items-center gap-0.5 text-gray-400">
                  {/* Botón de Editar */}
                  {!isAnulado && (
                    <button
                      disabled={loadingId === tx.id}
                      onClick={() => iniciarEdicion(tx)}
                      title="Modificar valor o descripción"
                      className="p-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {/* Botón de Anular */}
                  <button
                    disabled={loadingId === tx.id}
                    onClick={() => handleAnular(tx.id, tx.estado)}
                    title={isAnulado ? "Reactivar" : "Anular"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isAnulado ? 'hover:bg-emerald-50 hover:text-emerald-600 text-gray-300' : 'hover:bg-amber-50 hover:text-amber-600'
                    }`}
                  >
                    {isAnulado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  </button>

                  {/* Botón de Eliminar */}
                  <button
                    disabled={loadingId === tx.id}
                    onClick={() => handleEliminar(tx.id)}
                    title="Eliminar para siempre"
                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL / CORTINA FLOTANTE PARA EDITAR VALOR O DESCRIPCIÓN */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-xl border border-gray-100 animate-scaleUp">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-black text-gray-500 uppercase">Modificar Movimiento</span>
              <button onClick={() => setEditingTx(null)} className="p-1 rounded-full hover:bg-gray-200 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicion} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Valor / Monto ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="number"
                    required
                    value={nuevoMonto}
                    onChange={(e) => setNuevoMonto(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={guardandoEdicion}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                {guardandoEdicion ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
