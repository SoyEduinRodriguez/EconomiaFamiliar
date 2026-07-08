'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Users, RefreshCw, Calendar, PieChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';

export default function HogarDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. OBTENER EL MES ACTUAL DINÁMICAMENTE (Formato: YYYY-MM)
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  // 2. GENERAR LA LISTA DE MESES DINÁMICA (Mes actual + 5 meses atrás)
  const periodOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      // Capitalizar mes
      const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1);
      options.push({ value: val, label: labelCapitalized });
    }
    return options;
  }, []);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      // Filtrar directamente desde Supabase por el mes seleccionado para evitar errores de indexación
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('scope', 'hogar')
        .gte('fecha_transaccion', `${selectedPeriod}-01`)
        .lte('fecha_transaccion', `${selectedPeriod}-31`) // Supabase/Postgres tolera el -31 o puedes usar filtros de rango estándar
        .order('fecha_transaccion', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (err) {
      console.error('Error cargando cuentas del hogar:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Volver a consultar Supabase cada vez que el usuario cambie el mes en el recuadro
  useEffect(() => {
    fetchDatos();
  }, [selectedPeriod]);

  // Asegurar que no se procesen transacciones anuladas
  const filteredTransactions = useMemo(() => {
    return transacciones.filter(tx => tx.estado !== 'anulado');
  }, [transacciones]);

  // ANÁLISIS DE COSTO DE VIDA Y APORTES REALES
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
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">🏡 Costo de Vida del Hogar</h1>
          <p className="text-xs text-gray-500">¿Cuánto cuesta mantener la casa y quién asume los pagos?</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            
            {/* SELECTOR TOTALMENTE DINÁMICO */}
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)} 
              className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={fetchDatos} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-gray-900">
            <PlusCircle className="w-4 h-4" /> Gasto del Hogar
          </button>
        </div>
      </div>

      {/* MÉTRICA REINA */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Costo Total de Mantener la Casa</p>
          <h2 className="text-3xl font-black mt-1">${metrics.totalGastos.toLocaleString('es-CO')}</h2>
          <p className="text-xs text-slate-400 mt-1">Suma acumulada del mes seleccionado.</p>
        </div>
        <div className="p-3 bg-white/10 text-white rounded-xl self-start sm:self-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* ORIGEN DE FONDOS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-gray-500" /> Origen de los Fondos de la Casa
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

      {/* DISTRIBUCIÓN POR CATEGORÍA */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">¿En qué se va la plata del hogar?</h3>
        {metrics.distribucion.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin gastos de casa en este mes.</p>
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

      {/* HISTORIAL */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <TransactionTable transacciones={transacciones} onActionSuccess={fetchDatos} />
      </div>

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultScope="hogar" onActionSuccess={fetchDatos} />
    </div>
  );
}
