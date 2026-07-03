'use client';
import { useState, useEffect } from 'react';
import { PlusCircle, Target, CheckCircle2, TrendingUp, RefreshCw, DollarSign, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MetaForm from '@/components/MetaForm';

export default function MetasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el flujo de abono rápido
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [abonando, setAbonando] = useState(false);

  const fetchMetas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMetas(data || []);
    } catch (err) {
      console.error('Error cargando metas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetas();
  }, []);

  const handleAbonar = async (e) => {
    e.preventDefault();
    if (!selectedMeta || !montoAbono) return;
    setAbonando(true);

    const nuevoAlcanzado = parseFloat(selectedMeta.monto_alcanzado) + parseFloat(montoAbono);
    // Lógica dinámica: Si el nuevo monto iguala o supera el objetivo, pasa a cumplida
    const nuevoEstado = nuevoAlcanzado >= parseFloat(selectedMeta.monto_objetivo) ? 'cumplida' : 'activa';

    try {
      const { error } = await supabase
        .from('metas')
        .update({ 
          monto_alcanzado: nuevoAlcanzado,
          estado: nuevoEstado
        })
        .eq('id', selectedMeta.id);

      if (error) throw error;

      setMontoAbono('');
      setSelectedMeta(null);
      fetchMetas();
    } catch (err) {
      alert('Error al registrar el abono: ' + err.message);
    } finally {
      setAbonando(false);
    }
  };

  // Filtrar metas localmente
  const metasActivas = metas.filter(m => m.estado !== 'cumplida');
  const metasCumplidas = metas.filter(m => m.estado === 'cumplida');

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-800">Propósitos y Metas</h2>
          <p className="text-xs text-gray-400 font-medium">Sueños por cumplir y objetivos en pareja</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMetas} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-purple-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Meta
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400 font-medium">Cargando tus sueños...</div>
      ) : (
        <div className="space-y-8">
          
          {/* SECCIÓN 1: METAS ACTIVAS */}
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-purple-500" />
              Metas en Progreso ({metasActivas.length})
            </h3>

            {metasActivas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400 max-w-xl mx-auto shadow-xs">
                No hay metas activas en este momento. ¡Propón tu primer objetivo juntos hoy!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metasActivas.map((meta) => {
                  const pct = Math.min(Math.round((meta.monto_alcanzado * 100) / meta.monto_objetivo), 100);
                  return (
                    <div key={meta.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-gray-800 text-base">{meta.nombre}</h4>
                          <span className="text-xs font-black px-2 py-1 bg-purple-50 text-purple-600 rounded-lg">
                            {pct}%
                          </span>
                        </div>
                        {meta.fecha_limite && (
                          <p className="text-xs text-gray-400 mt-1 font-medium">Meta para: {meta.fecha_limite}</p>
                        )}
                      </div>

                      {/* Barra de progreso visual */}
                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-400">
                          <span>${parseFloat(meta.monto_alcanzado).toLocaleString('es-CO')}</span>
                          <span>de ${parseFloat(meta.monto_objetivo).toLocaleString('es-CO')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedMeta(meta)}
                        className="w-full py-2 bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-bold text-xs rounded-xl border border-gray-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Abonar a la Meta
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: METAS CUMPLIDAS */}
          {metasCumplidas.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Metas Cumplidas 🎉 ({metasCumplidas.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metasCumplidas.map((meta) => (
                  <div key={meta.id} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm line-through decoration-emerald-300">{meta.nombre}</h4>
                      <p className="text-xs text-emerald-600 font-bold mt-0.5">
                        ¡Objetivo alcanzado! Total: ${parseFloat(meta.monto_objetivo).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL CORTINA PARA ABONAR DINERO */}
      {selectedMeta && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-xl border border-gray-100 animate-scaleUp">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-black text-gray-500 uppercase">Abonar saldo</span>
              <button onClick={() => setSelectedMeta(null)} className="p-1 rounded-full hover:bg-gray-200 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAbonar} className="p-4 space-y-4">
              <p className="text-xs font-medium text-gray-600 text-center">
                ¿Cuánto vas a guardar para <span className="font-bold text-gray-800">"{selectedMeta.nombre}"</span>?
              </p>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                <input
                  type="number"
                  required
                  autoFocus
                  placeholder="0"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={abonando}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                {abonando ? 'Guardando...' : 'Confirmar Abono'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Formulario de creación */}
      <MetaForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onActionSuccess={fetchMetas}
      />

    </div>
  );
}
