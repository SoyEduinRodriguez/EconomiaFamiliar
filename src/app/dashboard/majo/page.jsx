'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import TransactionTable from '@/components/TransactionTable';
import { ArrowUpRight, ArrowDownRight, Wallet, RefreshCw } from 'lucide-react';

export default function MajoPage() {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);

  async function cargarDatosMajo() {
    setLoading(true);
    const { data, error } = await supabase
      .from('transacciones')
      .select('*, categorias(nombre)')
      .eq('scope', 'majo')
      .order('fecha_transaccion', { ascending: false });

    if (!error && data) {
      setTransacciones(data);
      const activos = data.filter(tx => tx.estado === 'activo');
      
      const ingSum = activos.filter(tx => tx.tipo_transaccion === 'ingreso').reduce((sum, tx) => sum + parseFloat(tx.monto), 0);
      const gastSum = activos.filter(tx => tx.tipo_transaccion === 'gasto').reduce((sum, tx) => sum + parseFloat(tx.monto), 0);
      
      setIngresos(ingSum);
      setGastos(gastSum);
    }
    setLoading(false);
  }

  useEffect(() => {
    cargarDatosMajo();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-pink-600">🙋‍♀️ Mis Finanzas - Majo</h1>
          <p className="text-sm text-gray-500">Sus ingresos, presupuestos independientes y gastos individuales.</p>
        </div>
        <button onClick={cargarDatosMajo} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Mis Ingresos</p>
            <h3 className="text-xl font-black text-emerald-600 mt-1">${ingresos.toLocaleString('es-CO')}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Mis Gastos Personales</p>
            <h3 className="text-xl font-black text-gray-800 mt-1">${gastos.toLocaleString('es-CO')}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Disponible Libre</p>
            <h3 className="text-xl font-black text-pink-600 mt-1">${(ingresos - gastos).toLocaleString('es-CO')}</h3>
          </div>
          <div className="p-3 bg-pink-50 text-pink-500 rounded-xl"><Wallet className="w-5 h-5" /></div>
        </div>
      </div>

      <TransactionTable transacciones={transacciones} onActionSuccess={cargarDatosMajo} />
    </div>
  );
}
