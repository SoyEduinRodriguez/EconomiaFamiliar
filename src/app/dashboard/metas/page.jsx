'use client';
import { useState, useEffect } from 'react';
import { PlusCircle, Target, CheckCircle2, TrendingUp, RefreshCw, DollarSign, X, ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MetaForm from '../../../components/MetaForm';

export default function MetasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metas, setMetas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el abono estructurado
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [abonando, setAbonando] = useState(false);

  // Estados para MODIFICAR META
  const [editingMeta, setEditingMeta] = useState(null);
  const [nuevoNombreMeta, setNuevoNombreMeta] = useState('');
  const [nuevoMontoTotal, setNuevoMontoTotal] = useState('');
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

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

    } catch (err) {
      console.error('Error cargando datos de metas/cuentas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatosIniciales();
  }, []);

  const handleAbonar = async (e) => {
    e.preventDefault();
    if (!selectedMeta || !montoAbono || !cuentaOrigen || !cuentaDestino) {
      alert('Por favor completa todos los campos del abono.');
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
        .update({ 
          monto_actual: nuevoActual,
          activa: sigueActiva
        })
        .eq('id', selectedMeta.id);

      if (errorMeta) throw errorMeta;

      const nombreCuentaOrig = cuentas.find(c => c.id === parseInt(cuentaOrigen))?.nombre_cuenta || 'Cuenta';
      const nombreCuentaDest = cuentas.find(c => c.id === parseInt(cuentaDestino))?.nombre_cuenta || 'Destino';

      const { error: errorTx } = await supabase
        .from('transacciones')
        .insert([
          {
            user_id: user?.id || null,
            tipo_transaccion: 'gasto',
            scope: 'hogar',
            monto: valorAbono,
            descripcion: `Abono meta: ${selectedMeta.nombre_meta} (${nombreCuentaOrig} ➡️ ${nombreCuentaDest})`,
            meta_id: selectedMeta.id,
            cuenta_id: parseInt(cuentaOrigen),
            estado: 'activo'
          }
        ]);

      if (errorTx) throw errorTx;

      setMontoAbono('');
      setCuentaOrigen('');
      setCuentaDestino('');
      setSelectedMeta(null);
      fetchDatosIniciales();
      alert('¡Abono registrado y procesado contablemente!');
    } catch (err) {
      alert('Error al registrar el abono contable: ' + err.message);
    } finally {
      setAbonando(false);
    }
  };

  // 🗑️ Función para ELIMINAR META
  const handleEliminarMeta = async (id, nombre) => {
    if (!window.confirm(`🚨 ¿Estás seguro de eliminar permanentemente la meta "${nombre}"? Esto no borrará tus transacciones pasadas.`)) return;
    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDatosIniciales();
    } catch (err) {
      alert('Error al eliminar la meta: ' + err.message);
    }
  };

  // ✏️ Abrir modal de edición precargando valores
  const iniciarEdicionMeta = (meta) => {
    setEditingMeta(meta);
    setNuevoNombreMeta(meta.nombre_meta);
    setNuevoMontoTotal(meta.monto_total);
    setNuevaFechaLimite(meta.fecha_limite || '');
  };

  // 💾 Guardar cambios de EDICIÓN META
  const handleGuardarEdicionMeta = async (e) => {
    e.preventDefault();
    if (!editingMeta || !nuevoNombreMeta || !nuevoMontoTotal) return;
    setGuardandoEdicion(true);

    // Validar si con el nuevo monto total ya se cumplió el propósito
    const sigueActiva = parseFloat(editingMeta.monto_actual) < parseFloat(nuevoMontoTotal);

    try {
      const { error } = await supabase
        .from('metas')
        .update({
          nombre_meta: nuevoNombreMeta,
          monto_total: parseFloat(nuevoMontoTotal),
          fecha_limite: nuevaFechaLimite || null,
          activa: sigueActiva
        })
        .eq('id', editingMeta.id);

      if (error) throw error;
      setEditingMeta(null);
      fetchDatosIniciales();
    } catch (err) {
      alert('Error al modificar meta: ' + err.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const metasActivas = metas.filter(m => m.activa === true);
  const metasCumplidas = metas.filter(m => m.activa === false);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-800">Propósitos y Metas</h2>
          <p className="text-xs text-gray-400 font-medium">Sueños por cumplir y objetivos en pareja</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDatosIniciales} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-purple-700"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Meta
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400 font-medium">Sincronizando cuentas y metas...</div>
      ) : (
        <div className="space-y-8">
          
          {/* METAS ACTIVAS */}
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-purple-500" />
              Metas en Progreso ({metasActivas.length})
            </h3>

            {metasActivas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400 max-w-xl mx-auto">
                No hay metas activas. ¡Propón tu primer objetivo juntos hoy!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metasActivas.map((meta) => {
                  const pct = Math.min(Math.round((meta.monto_actual * 100) / meta.monto_total), 100);
                  return (
                    <div key={meta.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-gray-800 text-base break-words max-w-[70%]">{meta.nombre_meta}</h4>
                          
                          {/* BOTONES DE EDICIÓN Y ELIMINACIÓN DE LA TARJETA */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-2 py-1 bg-purple-50 text-purple-600 rounded-lg">
                              {pct}%
                            </span>
                            <button 
                              onClick={() => iniciarEdicionMeta(meta)}
                              className="p-1 text-gray-300 hover:text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                              title="Editar meta"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleEliminarMeta(meta.id, meta.nombre_meta)}
                              className="p-1 text-gray-300 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                              title="Eliminar meta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                        {meta.fecha_limite && (
                          <p className="text-xs text-gray-400 mt-1 font-medium">Meta para: {meta.fecha_limite}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-400">
                          <span>${parseFloat(meta.monto_actual).toLocaleString('es-CO')}</span>
                          <span>de ${parseFloat(meta.monto_total).toLocaleString('es-CO')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedMeta(meta)}
                        className="w-full py-2 bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-bold text-xs rounded-xl border border-gray-100 flex items-center justify-center gap-1"
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

          {/* METAS CUMPLIDAS */}
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
                      <h4 className="font-bold text-emerald-900 text-sm line-through decoration-emerald-300">{meta.nombre_meta}</h4>
                      <p className="text-xs text-emerald-600 font-bold mt-0.5">Total: ${parseFloat(meta.monto_total).toLocaleString('es-CO')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEliminarMeta(meta.id, meta.nombre_meta)}
                        className="p-1.5 text-emerald-300 hover:text-red-500 rounded-lg"
                        title="Eliminar meta cumplida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL PARA ABONAR */}
      {selectedMeta && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-xl border border-gray-100">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-black text-gray-500 uppercase">Configurar Abono Contable</span>
              <button onClick={() => setSelectedMeta(null)} className="p-1 rounded-full hover:bg-gray-200 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAbonar} className="p-5 space-y-4">
              <p className="text-xs font-medium text-gray-500 text-center">
                Registrar ahorro para <span className="font-black text-purple-700">"{selectedMeta.nombre_meta}"</span>
              </p>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Monto a Guardar</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="number"
                    required
                    autoFocus
                    placeholder="0"
                    value={montoAbono}
                    onChange={(e) => setMontoAbono(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">¿De dónde sale el dinero? (Origen)</label>
                <select
                  required
                  value={cuentaOrigen}
                  onChange={(e) => setCuentaOrigen(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-gray-50 focus:outline-none"
                >
                  <option value="">-- Selecciona cuenta de retiro --</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>💳 {c.nombre_cuenta}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center my-1 text-purple-400">
                <ArrowRightLeft className="w-4 h-4 rotate-90" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">¿A qué cuenta va el ahorro? (Destino)</label>
                <select
                  required
                  value={cuentaDestino}
                  onChange={(e) => setCuentaDestino(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-gray-50 focus:outline-none"
                >
                  <option value="">-- Selecciona cuenta de depósito --</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>💰 {c.nombre_cuenta}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={abonando}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
              >
                {abonando ? 'Procesando movimiento...' : 'Confirmar y Descontar Balance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR LA CONFIGURACIÓN DE LA META */}
      {editingMeta && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-xl border border-gray-100">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-black text-gray-500 uppercase">Modificar Propósito</span>
              <button onClick={() => setEditingMeta(null)} className="p-1 rounded-full hover:bg-gray-200 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicionMeta} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre del Propósito</label>
                <input
                  type="text"
                  required
                  value={nuevoNombreMeta}
                  onChange={(e) => setNuevoNombreMeta(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Monto Objetivo ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="number"
                    required
                    value={nuevoMontoTotal}
                    onChange={(e) => setNuevoMontoTotal(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha Límite (Opcional)</label>
                <input
                  type="date"
                  value={nuevaFechaLimite}
                  onChange={(e) => setNuevaFechaLimite(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={guardandoEdicion}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                {guardandoEdicion ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}

      <MetaForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onActionSuccess={fetchDatosIniciales} />

    </div>
  );
}
