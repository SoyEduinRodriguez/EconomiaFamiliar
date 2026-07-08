'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';

export default function EduinDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener el mes actual dinámicamente (YYYY-MM)
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Lista de meses dinámica (Mes actual + 5 meses atrás)
  const periodOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  }, []);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      // Trae los movimientos personales de Eduin + lo que Eduin pagó del Hogar en este mes específico
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .or(`and(scope.eq.personal,pagado_por.eq.eduin),and(scope.eq.hogar,pagado_por.eq.eduin)`)
        .gte('fecha_transaccion', `${selectedPeriod}-01`)
        .lte('fecha_transaccion', `${selectedPeriod}-31`)
        .order('fecha_transaccion', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (err) {
      console.error('Error cargando finanzas de Eduin:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [selectedPeriod]);

  // Cálculos de métricas personales
  const metrics = useMemo(() => {
    let ingresos = 0;
    let gastosPersonales = 0;
    let aportesHogar = 0;
    const categorias = {};

    transacciones.filter(tx => tx.estado !== 'anulado').forEach(tx => {
      const monto = parseFloat(tx.monto) || 0;
      if (tx.tipo_transaccion === 'ingreso') {
        ingresos += monto;
      } else if (tx.tipo_transaccion === 'gasto') {
        if (tx.scope === 'hogar') {
          aportesHogar += monto;
        } else {
          gastosPersonales += monto;
        }
        const catName = tx.categoria || 'Otros';
        categorias[catName] = (categorias[catName] || 0) + monto;
      }
    });

    const totalEgresos = gastosPersonales + aportesHogar;
    const saldoDisponible = ingresos - totalEgresos;
    const pctConsumo = ingresos > 0 ? (totalEgresos / ingresos) * 100 : 0;

    const distribucion = Object.entries(categorias).map(([name, value]) => ({
      name,
      value,
      porcentaje: totalEgresos > 0 ? (value / totalEgresos) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return { ingresos, gastosPersonales, aportesHogar, totalEgresos, saldoDisponible, pctConsumo, distribucion };
  }, [transacciones]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">👨‍💻 Billetera de Eduin</h1>
          <p className="text-xs text-gray-500">Control de ingresos personales y flujos inyectados al hogar.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
              {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <button onClick={fetchDatos} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-700">
            <PlusCircle className="w-4 h-4" /> Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Mis Ingresos</p>
            <h3 className="text-xl font-black text-emerald-600 mt-1">${metrics.ingresos.toLocaleString('es-CO')}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Mis Gastos Totales</p>
            <h3 className="text-xl font-black text-rose-600 mt-1">${metrics.totalEgresos.toLocaleString('es-CO')}</h3>
            <span className="text-[10px] text-gray-400">({metrics.gastosPersonales.toLocaleString('es-CO')} propios / {metrics.aportesHogar.toLocaleString('es-CO')} casa)</span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-slate-900 p-4 rounded-2xl text-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-200 uppercase">Disponible / Ahorro</p>
            <h3 className="text-xl font-black mt-1">${metrics.saldoDisponible.toLocaleString('es-CO')}</h3>
          </div>
          <div className="p-2.5 bg-white/10 text-white rounded-xl"><Wallet className="w-5 h-5" /></div>
        </div>
      </div>

      {/* MEDIDOR DE CONSUMO */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
          <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-gray-400" /> Presión del Gasto Mensual</span>
          <span>{metrics.pctConsumo.toFixed(1)}% consumido</span>
        </div>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${metrics.pctConsumo > 85 ? 'bg-rose-500' : metrics.pctConsumo > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
            style={{ width: `${Math.min(metrics.pctConsumo, 100)}%` }} 
          />
        </div>
      </div>

      {/* DESGLOSE CATEGORÍAS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">¿En qué invertiste tu dinero?</h3>
        {metrics.distribucion.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin movimientos registrados este mes.</p>
        ) : (
          <div className="space-y-3.5">
            {metrics.distribucion.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>{cat.name}</span>
                  <span>${cat.value.toLocaleString('es-CO')} ({cat.porcentaje.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${cat.porcentaje}%` }} />
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

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultPagadoPor="eduin" onActionSuccess={fetchDatos} />
    </div>
  );
}
