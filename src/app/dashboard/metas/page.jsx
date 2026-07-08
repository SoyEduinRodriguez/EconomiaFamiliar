'use client';
import { useState, useEffect } from 'react';
import { PlusCircle, Target, CheckCircle2, RefreshCw, DollarSign, X, ArrowRightLeft, Trophy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MetaForm from '../../../components/MetaForm';

export default function MetasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metas, setMetas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [casillas, setCasillas] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Abonos
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [metaVerTablero, setMetaVerTablero] = useState(null); 
  
  const [montoAbono, setMontoAbono] = useState('');
  const [casillaSeleccionada, setCasillaSeleccionada] = useState(null);
  
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [abonando, setAbonando] = useState(false);

  const fetchDatosIniciales = async () => {
    setLoading(true);
    try {
      const { data: dataMetas, error: errorMetas } = await supabase
        .from('metas')
        .select('*')
        .order('created_at', { ascending: true });
      if (errorMetas) throw errorMetas;
      setMetas(dataMetas || []);

      const { data: dataCuentas, error: errorCuentas } = await supabase
        .from('cuentas_bancarias')
        .select('*')
        .order('nombre_cuenta', { ascending: true });
      if (errorCuentas) throw errorCuentas;
      setCuentas(dataCuentas || []);

      if (metaVerTablero) {
        cargarCasillasTablero(metaVerTablero.id);
      }

    } catch (err) {
      console.error('Error general:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarCasillasTablero = async (metaId) => {
    const { data, error } = await supabase
      .from('casillas_metas')
      .select('*')
      .eq('meta_id', metaId)
      .order('id', { ascending: true });
    if (!error) setCasillas(data || []);
  };

  useEffect(() => {
    fetchDatosIniciales();
  }, [metaVerTablero]);

  const handleAbrirTablero = (meta) => {
    setMetaVerTablero(meta);
    cargarCasillasTablero(meta.id);
  };

  const handleClickCasilla = (casilla) => {
    if (casilla.tachada) return; 
    setCasillaSeleccionada(casilla);
    setMontoAbono(casilla.valor.toString());
    setSelectedMeta(metaVerTablero);
  };

  const handleAbonar = async (e) => {
    e.preventDefault();
    if (!selectedMeta || !montoAbono || !cuentaOrigen) {
      alert('Completa los campos requeridos.');
      return;
    }
    setAbonando(true);

    const valorAbono = parseFloat(montoAbono);
    const nuevoActual = parseFloat(selectedMeta.monto_actual) + valorAbono;
    const sigueActiva = nuevoActual < parseFloat(selectedMeta.monto_total);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: errorMeta } = await supabase
        .from('metas')
        .update({ monto_actual: nuevoActual, activa: sigueActiva })
        .eq('id', selectedMeta.id);
      if (errorMeta) throw errorMeta;

      if (casillaSeleccionada) {
        const { error: errorTachas } = await supabase
          .from('casillas_metas')
          .update({ tachada: true })
          .eq('id', casillaSeleccionada.id);
        if (errorTachas) throw errorTachas;
      }

      const nombreCuentaOrig = cuentas.find(c => c.id === parseInt(cuentaOrigen))?.nombre_cuenta || 'Cuenta';
      const { error: errorTx } = await supabase
        .from('transacciones')
        .insert([
          {
            user_id: user?.id || null,
            tipo_transaccion: 'gasto',
            scope: 'hogar',
            monto: valorAbono,
            descripcion: `Abono Alcancía: ${selectedMeta.nombre_meta} (Desde ${nombreCuentaOrig})`,
            meta_id: selectedMeta.id,
            cuenta_id: parseInt(cuentaOrigen),
            estado: 'activo'
          }
        ]);
      if (errorTx) throw errorTx;

      setMontoAbono('');
      setCuentaOrigen('');
      setCuentaDestino('');
      setCasillaSeleccionada(null);
      setSelectedMeta(null);
      fetchDatosIniciales();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAbonando(false);
    }
  };

  const metasActivas = metas.filter(m => m.activa === true);
  const metasCumplidas = metas.filter(m => m.activa === false);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-800">Propósitos y Metas</h2>
          <p className="text-xs text-gray-400 font-medium">Objetivos y Alcancías de ahorro compartidas</p>
        </div>
        <div className="flex gap-2">
          {metaVerTablero && (
            <button onClick={() => setMetaVerTablero(null)} className="px-3 py-2 bg-gray-800 text-white font-bold text-xs rounded-xl">
              ⬅️ Volver a Metas
            </button>
          )}
          <button onClick={fetchDatosIniciales} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-purple-700">
            <PlusCircle className="w-4 h-4" /> Nueva Meta / Alcancía
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400 font-medium">Sincronizando alcancías...</div>
      ) : metaVerTablero ? (
        
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <span className="text-[10px] bg-amber-100 text-amber-700 font-black px-2.5 py-1 rounded-full uppercase">Alcancía Virtual Activa</span>
            <h3 className="text-xl font-black text-gray-800">{metaVerTablero.nombre_meta}</h3>
            <p className="text-xs font-bold text-purple-600">
              Acumulado: ${parseFloat(metaVerTablero.monto_actual).toLocaleString('es-CO')} de ${parseFloat(metaVerTablero.monto_total).toLocaleString('es-CO')}
            </p>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100 max-h-96 overflow-y-auto scrollbar-none">
            {casillas.map((casilla) => (
              <button
                key={casilla.id}
                disabled={casilla.tachada}
                onClick={() => handleClickCasilla(casilla)}
                className={`p-2 text-[10px] font-black rounded-lg transition-all text-center flex flex-col items-center justify-center border ${
                  casilla.tachada
                    ? 'bg-slate-900 border-slate-900 text-emerald-400 opacity-90 cursor-not-allowed line-through'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-amber-50 hover:border-amber-400 hover:scale-105'
                }`}
              >
                {casilla.tachada ? <Check className="w-3.5 h-3.5 mb-0.5" /> : `$${casilla.valor}`}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-wider">💡 Toca una casilla numérica para registrar tu abono físico</p>
        </div>

      ) : (
        
        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Target className="w-4 h-4 text-purple-500" /> Metas y Retos en Curso ({metasActivas.length})</h3>
            {metasActivas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400 max-w-xl mx-auto">No hay propósitos activos.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metasActivas.map((meta) => {
                  const pct = Math.min(Math.round((meta.monto_actual * 100) / meta.monto_total), 100);
                  const esReto = meta.nombre_meta.includes('(Reto 1M)');

                  return (
                    <div key={meta.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-gray-800 text-base">{meta.nombre_meta}</h4>
                          {meta.fecha_limite && <p className="text-xs text-gray-400 mt-1 font-medium">Meta para: {meta.fecha_limite}</p>}
                        </div>
                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${esReto ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>{pct}%</span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${esReto ? 'bg-amber-500' : 'bg-purple-600'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-400">
                          <span>${parseFloat(meta.monto_actual).toLocaleString('es-CO')}</span>
                          <span>de ${parseFloat(meta.monto_total).toLocaleString('es-CO')}</span>
                        </div>
                      </div>

                      {esReto ? (
                        <button onClick={() => handleAbrirTablero(meta)} className="w-full py-2 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white font-bold text-xs rounded-xl border border-amber-100 flex items-center justify-center gap-1 transition-all">
                          <Trophy className="w-3.5 h-3.5" /> Abrir Tablero Interactivo
                        </button>
                      ) : (
                        <button onClick={() => { setSelectedMeta(meta); setMontoAbono(''); }} className="w-full py-2 bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-bold text-xs rounded-xl border border-gray-100 flex items-center justify-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Abonar Saldo Directo
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {metasCumplidas.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Objetivos Alcanzados 🎉 ({metasCumplidas.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metasCumplidas.map((meta) => (
                  <div key={meta.id} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm line-through decoration-emerald-300">{meta.nombre_meta}</h4>
                      <p className="text-xs text-emerald-600 font-bold mt-0.5">¡Completado! Total: ${parseFloat(meta.monto_total).toLocaleString('es-CO')}</p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedMeta && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-xl border border-gray-100">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-black text-gray-500 uppercase">Confirmar Depósito</span>
              <button onClick={() => { setSelectedMeta(null); setCasillaSeleccionada(null); }} className="p-1 rounded-full hover:bg-gray-200 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleAbonar} className="p-4 space-y-4">
              <p className="text-xs font-medium text-gray-600 text-center">Abonando <span className="font-bold text-slate-800">${parseFloat(montoAbono).toLocaleString('es-CO')}</span> a tu alcancía.</p>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">¿De qué cuenta sale el dinero?</label>
                <select required value={cuentaOrigen} onChange={(e) => setCuentaOrigen(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-gray-50 focus:outline-none">
                  <option value="">-- Elige cuenta origen --</option>
                  {cuentas.map(c => <option key={c.id} value={c.id}>💳 {c.nombre_cuenta}</option>)}
                </select>
              </div>

              <button type="submit" disabled={abonando} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs">
                {abonando ? 'Procesando tacha...' : 'Tachar casilla y Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      <MetaForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onActionSuccess={fetchDatosIniciales} />
    </div>
  );
}
