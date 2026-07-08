'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Users, Scale, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';

export default function HogarDashboard() {
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
        .eq('scope', 'hogar')
        .order('fecha_transaccion', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (err) {
      console.error('Error cargando cuentas del hogar:', err.message);
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

  // ANÁLISIS DE GASTOS COMPARTIDOS Y BALANCE DE PAREJA
  const metrics = useMemo(() => {
    let totalGastos = 0;
    let pusoEduin = 0;
    let pusoMajo = 0;
    const categorias = {};

    filteredTransactions.forEach(tx => {
      if (tx.tipo_transaccion === 'gasto') {
        const monto = parseFloat(tx.monto) || 0;
        totalGastos += monto;

        // Quién sacó la plata de su bolsillo
        if (tx.pagado_por === 'eduin') pusoEduin += monto;
        if (tx.pagado_por === 'majo') pusoMajo += monto;

        const catName = tx.categoria || 'Otros';
        categorias[catName] = (categorias[catName] || 0) + monto;
      }
    });

    // Ajuste de cuentas (50/50)
    const cuotaEquitativa = totalGastos / 2;
    let balanceMensaje = 'Están a paz y salvo';
    let saldoDiferencia = 0;
    let deudor = '';

    if (pusoEduin > pusoMajo) {
      saldoDiferencia = cuotaEquitativa - pusoMajo;
      balanceMensaje = `⚠️ Majo le debe a Eduin: $${Math.round(saldoDiferencia).toLocaleString('es-CO')}`;
    } else if (pusoMajo > pusoEduin) {
      saldoDiferencia = cuotaEquitativa - pusoEduin;
      balanceMensaje = `⚠️ Eduin le debe a Majo: $${Math.round(saldoDiferencia).toLocaleString('es-CO')}`;
    }

    const distribucion = Object.entries(categorias).map(([name, value]) => ({
      name,
      value,
      porcentaje: totalGastos > 0 ? (value / totalGastos) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return { totalGastos, pusoEduin, pusoMajo, balanceMensaje, distribucion };
  }, [filteredTransactions]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">🏡 Cuentas del Hogar</h1>
          <p className="text-xs text-gray-500">Gastos unificados e igualación de saldos</p>
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
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-gray-900">
            <PlusCircle className="w-4 h-4" /> Registrar Gasto Hogar
          </button>
        </div>
      </div>

      {/* METRICAS DEL GRUPO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs font-medium text-gray-400 uppercase">Total Gastos Casa</p><h3 className="text-xl font-bold text-gray-800 mt-1">${metrics.totalGastos.toLocaleString('es-CO')}</h3></div>
          <div className="p-2.5 bg-gray-50 text-gray-600 rounded-xl"><Users className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs font-medium text-gray-400 uppercase">Aportó Eduin</p><h3 className="text-xl font-bold text-emerald-600 mt-1">${metrics.pusoEduin.toLocaleString('es-CO')}</h3></div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs font-medium text-gray-400 uppercase">Aportó Majo</p><h3 className="text-xl font-bold text-rose-600 mt-1">${metrics.pusoMajo.toLocaleString('es-CO')}</h3></div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
      </div>

      {/* BALANCE DE CUENTAS EQUITATIVO */}
      <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl flex items-center gap-3">
        <div className="p-2 bg-white text-amber-600 rounded-xl shadow-sm"><Scale className="w-5 h-5" /></div>
        <div>
          <h4 className="text-sm font-bold text-amber-900">Cierre Contable de Pareja</h4>
          <p className="text-xs text-amber-700 mt-0.5 font-medium">{metrics.balanceMensaje}</p>
        </div>
      </div>

      {/* DISTRIBUCIÓN DE CONSUMO DE LA CASA */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Gastos del Hogar por Categoría</h3>
        {metrics.distribucion.length === 0 ? (<p className="text-xs text-gray-400 text-center py-2">Sin gastos registrados en la casa.</p>) : (
          <div className="space-y-3">
            {metrics.distribucion.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-gray-600"><span>{cat.name}</span><span>${cat.value.toLocaleString('es-CO')} ({cat.porcentaje.toFixed(1)}%)</span></div>
                <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden"><div className="h-full bg-gray-700" style={{ width: `${cat.porcentaje}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLA HISTORIAL */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <TransactionTable transacciones={transacciones.filter(t => t.fecha_transaccion?.startsWith(selectedPeriod))} onActionSuccess={fetchDatos} />
      </div>

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultScope="hogar" onActionSuccess={fetchDatos} />
    </div>
  );
}
