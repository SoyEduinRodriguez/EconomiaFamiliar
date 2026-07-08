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
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-transparent font-
