import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useTransactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. CREAR UNA NUEVA TRANSACCIÓN (Ingreso o Gasto)
  const createTransaction = async (transactionData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: txError } = await supabase
        .from('transacciones')
        .insert([
          {
            user_id: transactionData.userId, // ID de Auth Supabase
            tipo_transaccion: transactionData.tipo, // 'ingreso' o 'gasto'
            scope: transactionData.scope, // 'eduin', 'majo' o 'hogar'
            categoria_id: transactionData.categoriaId,
            cuenta_id: transactionData.cuentaId,
            monto: parseFloat(transactionData.monto),
            descripcion: transactionData.descripcion || '',
            fecha_transaccion: transactionData.fecha || new Date().toISOString().split('T')[0],
            meta_id: transactionData.metaId || null, // Si es un abono a propósito
            estado: 'activo'
          }
        ])
        .select();

      if (txError) throw txError;
      return data[0];
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 2. MODIFICAR UNA TRANSACCIÓN EXISTENTE
  const updateTransaction = async (id, updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: txError } = await supabase
        .from('transacciones')
        .update({
          monto: parseFloat(updatedData.monto),
          categoria_id: updatedData.categoriaId,
          cuenta_id: updatedData.cuentaId,
          descripcion: updatedData.descripcion,
          fecha_transaccion: updatedData.fecha,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (txError) throw txError;
      return data[0];
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 3. ANULAR UNA TRANSACCIÓN (En lugar de borrar, cambiamos el estado)
  const annulTransaction = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: txError } = await supabase
        .from('transacciones')
        .update({ 
          estado: 'anulado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (txError) throw txError;
      return data[0];
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createTransaction, updateTransaction, annulTransaction, loading, error };
}
