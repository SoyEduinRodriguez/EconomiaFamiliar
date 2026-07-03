'use client';
import { useState, useEffect } from 'react';
import { PlusCircle, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';

export default function MajoDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState({ ingresos: 0, gastos: 0, balance: 0 });

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('scope', 'majo')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);

      let totalIngresos = 0;
      let totalGastos = 0;
      
      (data || []).forEach(tx => {
        const monto = parseFloat(tx.monto) || 0;
        if (tx.tipo_transaccion === 'ingreso') {
          totalIngresos += monto;
        } else {
          totalGastos += monto;
        }
      });

      setMetricas({
        ingresos: totalIngresos,
        gastos: totalGastos,
        balance: totalIngresos - totalGastos
      });
    } catch (err) {
      console.error('Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-purple-800">Billetera de Majo</h2>
          <p className="text-xs text-gray-400 font-medium">Finanzas y movimientos personales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDatos} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-purple-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar Movimiento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Saldo Personal</span>
            <Wallet className="w-4 h-4 text-gray-400" />
          </div>
          <p className={`text-lg font-black ${metricas.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
            ${metricas.balance.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Mis Ingresos</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-600">${metricas.ingresos.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Mis Gastos</span>
            <ArrowDownRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-black text-gray-700">${metricas.gastos.toLocaleString('es-CO')}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-gray-400 font-medium">Cargando billetera...</div>
      ) : (
        <TransactionTable transacciones={transacciones} onActionSuccess={fetchDatos} />
      )}

      <TransactionForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultScope="majo"
        onActionSuccess={fetchDatos}
      />
    </div>
  );
}
