'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Users, RefreshCw, PieChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';

export default function HogarDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      // Consulta limpia y global: Trae TODO lo que corresponde al hogar
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('scope', 'hogar')
        .order('fecha_transaccion', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (err) {
      console.error('Error cargando cuentas globales del hogar:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transacciones.filter(tx => tx.estado !== 'anulado');
  }, [transacciones]);

  // Métricas acumuladas históricas
  const metrics = useMemo(() => {
    let totalGastos = 0;
    let pusoEduin = 0;
    let pusoMajo = 0;
    const categorias = {};

    filteredTransactions.forEach(tx => {
      if (tx.tipo_transaccion === 'gasto') {
        const monto = parseFloat(tx.monto) || 0;
        totalGastos += monto;

        if (tx.pagado_por === 'eduin') pusoEduin += monto;
        if (tx.pagado_por === 'majo') pusoMajo += monto;

        const catName = tx.categoria || 'Otros';
        categorias[catName] = (categorias[catName] || 0) + monto;
      }
    });

    const pctEduin = totalGastos > 0 ? (pusoEduin / totalGastos) * 100 : 0;
    const pctMajo = totalGastos > 0 ? (pusoMajo / totalGastos) * 100 : 0;

    const distribucion = Object.entries(categorias).map(([name, value]) => ({
      name,
      value,
      porcentaje: totalGastos > 0 ? (value / totalGastos) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return { totalGastos, pusoEduin, pusoMajo, pctEduin, pctMajo, distribucion };
  }, [filteredTransactions]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* CABECERA UNIFICADA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">🏡 Costo de Vida del Hogar</h1>
          <p className="text-xs text-gray-500">Historial unificado y acumulado de los gastos de la casa.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button onClick={fetchDatos} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-gray-900">
            <PlusCircle className="w-4 h-4" /> Gasto del Hogar
          </button>
        </div>
      </div>

      {/* MÉTRICA PRINCIPAL */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Costo Acumulado Total de la Casa</p>
          <h2 className="text-3xl font-black mt-1">${metrics.totalGastos.toLocaleString('es-CO')}</h2>
        </div>
        <div className="p-3 bg-white/10 text-white rounded-xl self-start sm:self-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* REPARTO DE APORTES */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-gray-500" /> Distribución Histórica de Fondos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-900">Pagado por Eduin</span>
              <span className="text-xs font-bold text-indigo-700">{metrics.pctEduin.toFixed(1)}%</span>
            </div>
            <p className="text-lg font-bold text-gray-800">${metrics.pusoEduin.toLocaleString('es-CO')}</p>
            <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: `${metrics.pctEduin}%` }} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-rose-900">Pagado por Majo</span>
              <span className="text-xs font-bold text-rose-700">{metrics.pctMajo.toFixed(1)}%</span>
            </div>
            <p className="text-lg font-bold text-gray-800">${metrics.pusoMajo.toLocaleString('es-CO')}</p>
            <div className="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${metrics.pctMajo}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* DESGLOSE CATEGORÍAS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">¿En qué se ha ido el dinero del hogar?</h3>
        {metrics.distribucion.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin gastos de casa registrados.</p>
        ) : (
          <div className="space-y-3.5">
            {metrics.distribucion.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>{cat.name}</span>
                  <span>${cat.value.toLocaleString('es-CO')} ({cat.porcentaje.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700" style={{ width: `${cat.porcentaje}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLA GLOBAL */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <TransactionTable transacciones={transacciones} onActionSuccess={fetchDatos} />
      </div>

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultScope="hogar" onActionSuccess={fetchDatos} />
    </div>
  );
}
