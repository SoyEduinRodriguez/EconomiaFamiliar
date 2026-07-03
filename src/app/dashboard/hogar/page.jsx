'use client';
import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import { Users, ArrowUpRight, ArrowDownRight, Scale, Plus } from 'lucide-react';

export default function HogarPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 flex items-center gap-2">
            🏡 Economía de Casa
          </h1>
          <p className="text-sm text-gray-500">Gastos compartidos y balance de cuentas.</p>
        </div>
        
        {/* Botón Flotante/Acceso rápido para agregar gasto */}
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/10 transition-all"
        >
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </div>

      {/* Tarjetas de Resumen Financiero del Mes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Total Gastos Hogar</p>
            <h3 className="text-xl font-black text-gray-800 mt-1">$0</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Aportado por Eduin</p>
            <h3 className="text-xl font-black text-gray-800 mt-1">$0</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Aportado por Majo</p>
            <h3 className="text-xl font-black text-gray-800 mt-1">$0</h3>
          </div>
          <div className="p-3 bg-pink-50 text-pink-500 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Alerta de Cuentas claras (Quién le debe a quién) */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Scale className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-amber-800 text-sm">Cuentas del Mes</h4>
          <p className="text-xs text-amber-700 mt-0.5">
            Las cuentas están perfectamente equilibradas por ahora. ¡Buen trabajo en equipo!
          </p>
        </div>
      </div>

      {/* Gráficos y Tablas se inyectarán abajo de esto */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-gray-400">Gráfico de gastos por categoría (Próximamente)</p>
      </div>

      {/* Modal / Formulario Desplegable */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-sm"
            >
              ✕
            </button>
            <TransactionForm userId={null} onTransactionSuccess={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
