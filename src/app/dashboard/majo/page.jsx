'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';

export default function MajoDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .or('scope.eq.majo,and(scope.eq.hogar,pagado_por.eq.majo)')
        .order('fecha_transaccion', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (err) {
      console.error('Error cargando billetera de Majo:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transacciones.filter(tx => tx.fecha_transaccion?.startsWith(selectedPeriod) && tx.estado !== 'anulado');
  }, [transacciones, selectedPeriod]);

  const metrics = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    const categoriasGastos = {};

    filteredTransactions.forEach(tx => {
      const monto = parseFloat(tx.monto) || 0;
      if (tx.tipo_transaccion === 'ingreso') {
        ingresos += monto;
      } else {
        gastos += monto;
        const catName = tx.categoria || 'Otros';
        categoriasGastos[catName] = (categoriasGastos[catName] || 0) + monto;
      }
    });

    const balance = ingresos - gastos;
    const capacidadAhorro = ingresos > 0 ? (balance / ingresos) * 100 : 0;
    const today = new Date();
    const [year, month] = selectedPeriod.split('-').map(Number);
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
    const diasTranscurridos = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();
    const gastoDiario = gastos / (diasTranscurridos || 1);
    const porcentajeConsumo = ingresos > 0 ? (gastos / ingresos) * 100 : 0;

    const distribucion = Object.entries(categoriasGastos).map(([name, value]) => ({
      name,
      value,
      porcentaje: gastos > 0 ? (value / gastos) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return { ingresos, gastos, balance, capacidadAhorro, gastoDiario, porcentajeConsumo, distribucion };
  }, [filteredTransactions, selectedPeriod]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">🙋‍♀️ Billetera de Majo</h1>
          <p className="text-xs text-gray-500">Flujo de caja personal y aportes al hogar</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
              <option value="2026-07">Julio 2026</option>
              <option value="2026-06">Junio 2026</option>
              <option value="2026-05">Mayo 2026</option>
            </select>
          </div>
          <button onClick={fetchDatos} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-rose-700">
            <PlusCircle className="w-4 h-4" /> Movimiento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs font-medium text-gray-400 uppercase">Mis Ingresos</p><h3 className="text-xl font-bold text-gray-800 mt-1">${metrics.ingresos.toLocaleString('es-CO')}</h3></div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs font-medium text-gray-400 uppercase">Mis Gastos + Aportes</p><h3 className="text-xl font-bold text-gray-800 mt-1">${metrics.gastos.toLocaleString('es-CO')}</h3></div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs font-medium text-gray-400 uppercase">Saldo Disponible</p><h3 className={`text-xl font-bold mt-1 ${metrics.balance >= 0 ? 'text-rose-600' : 'text-red-500'}`}>${metrics.balance.toLocaleString('es-CO')}</h3></div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Wallet className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex justify-between items-center text-sm"><span className="font-semibold text-gray-700">Velocidad de Gasto Mensual</span><span className="font-bold text-gray-600">{metrics.porcentajeConsumo.toFixed(1)}% del Ingreso</span></div>
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-500 ${metrics.porcentajeConsumo >= 80 ? 'bg-red-500' : metrics.porcentajeConsumo >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(metrics.porcentajeConsumo, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-100/50"><span className="text-xs font-medium text-rose-600 uppercase tracking-wider">Capacidad de Ahorro</span><h4 className="text-2xl font-bold text-gray-800 mt-1">{metrics.capacidadAhorro.toFixed(1)}%</h4></div>
        <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border border-amber-100/50"><span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Quema Promedio Diaria</span><h4 className="text-2xl font-bold text-gray-800 mt-1">${Math.round(metrics.gastoDiario).toLocaleString('es-CO')}</h4></div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Distribución de Gastos</h3>
        {metrics.distribucion.length === 0 ? (<p className="text-xs text-gray-400 text-center py-2">Sin gastos en este mes.</p>) : (
          <div className="space-y-3">
            {metrics.distribucion.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-gray-600"><span>{cat.name}</span><span>${cat.value.toLocaleString('es-CO')} ({cat.porcentaje.toFixed(1)}%)</span></div>
                <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden"><div className="h-full bg-rose-500" style={{ width: `${cat.porcentaje}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <TransactionTable transacciones={transacciones.filter(t => t.fecha_transaccion?.startsWith(selectedPeriod))} onActionSuccess={fetchDatos} />
      </div>
      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultScope="majo" onActionSuccess={fetchDatos} />
    </div>
  );
}
