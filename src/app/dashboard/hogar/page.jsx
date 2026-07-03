'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import TransactionForm from '@/components/TransactionForm';
import TransactionTable from '@/components/TransactionTable';
import { ArrowDownRight, ArrowUpRight, Scale, Plus, RefreshCw } from 'lucide-react';

export default function HogarPage() {
  const [showModal, setShowModal] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de consolidado financiero
  const [totalHogar, setTotalHogar] = useState(0);
  const [aporteEduin, setAporteEduin] = useState(0);
  const [aporteMajo, setAporteMajo] = useState(0);

  async function cargarMovimientosHogar() {
    setLoading(true);
    // Traemos los movimientos cuyo scope sea 'hogar' (Gastos conjuntos)
    const { data, error } = await supabase
      .from('transacciones')
      .select('*, categorias(nombre)')
      .eq('scope', 'hogar')
      .order('fecha_transaccion', { ascending: false });

    if (!error && data) {
      setTransacciones(data);
      
      // Filtrar movimientos activos para los cálculos en frío
      const activos = data.filter(tx => tx.estado === 'activo');
      
      const total = activos.reduce((sum, tx) => sum + parseFloat(tx.monto), 0);
      // Para saber quién aportó, cruzamos con el ID simulado o scope de registro rápido
      const eduinSum = activos.filter(tx => tx.user_id === '00000000-0000-0000-0000-000000000000').reduce((sum, tx) => sum + parseFloat(tx.monto), 0); // Reemplazar con Auth real después
      const majoSum = total - eduinSum; 

      setTotalHogar(total);
      setAporteEduin(eduinSum);
      setAporteMajo(majoSum);
    }
    setLoading(false);
  }

  useEffect(() => {
    cargarMovimientosHogar();
  }, []);

  // Calcular diferencia equilibrada (50/50)
  const mitadIdeal = totalHogar / 2;
  const saldoDiferencia = aporteEduin - mitadIdeal;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800">🏡 Economía de Casa</h1>
          <p className="text-sm text-gray-500">Gastos compartidos y balance de cuentas conjuntas.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargarMovimientosHogar} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Registrar Gasto
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Total Gastos Hogar</p>
            <h3 className="text-xl font-black text-gray-800 mt-1">${totalHogar.toLocaleString('es-CO')}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Puesto por Eduin</p>
            <h3 className="text-xl font-black text-gray-800 mt-1">${aporteEduin.toLocaleString('es-CO')}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">Puesto por Majo</p>
            <h3 className="text-xl font-black text-gray-800 mt-1">${aporteMajo.toLocaleString('es-CO')}</h3>
          </div>
          <div className="p-3 bg-pink-50 text-pink-500 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Balance de Cuentas */}
      {totalHogar > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Scale className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-amber-800 text-sm">Cuentas del Mes (Equilibrio 50/50)</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              {saldoDiferencia === 0 
                ? "Están perfectamente al día. ¡Cuentas claras!" 
                : saldoDiferencia > 0 
                  ? `Majo le debe a Eduin $${Math.abs(saldoDiferencia).toLocaleString('es-CO')} para quedar a mano.`
                  : `Eduin le debe a Majo $${Math.abs(saldoDiferencia).toLocaleString('es-CO')} para quedar a mano.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Tabla del Historial Real */}
      <TransactionTable transacciones={transacciones} onActionSuccess={cargarMovimientosHogar} />

      {/* Modal Desplegable */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 font-bold text-sm z-50">✕</button>
            <TransactionForm userId={null} onTransactionSuccess={() => { setShowModal(false); cargarMovimientosHogar(); }} />
          </div>
        </div>
      )}
    </div>
  );
}
