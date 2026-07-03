'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTransactions } from '@/hooks/useTransactions';
import { Target, Plus, TrendingUp, Calendar, DollarSign, CheckCircle } from 'lucide-react';

export default function MetasPage() {
  const { createTransaction, loading: txLoading } = useTransactions();
  
  // Estados de datos
  const [metas, setMetas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para los modales/formularios
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState(null);

  // Campos para nueva Meta
  const [nombreMeta, setNombreMeta] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  // Campos para nuevo Abono
  const [montoAbono, setMontoAbono] = useState('');
  const [scopeAbono, setScopeAbono] = useState('eduin'); // Quién saca la plata
  const [cuentaId, setCuentaId] = useState('');

  // Cargar metas y cuentas desde Supabase
  async function cargarDatos() {
    setLoading(true);
    const { data: metasData } = await supabase.from('metas').select('*').eq('activa', true).order('created_at', { ascending: false });
    const { data: cuentasData } = await supabase.from('cuentas_bancarias').select('*');
    
    if (metasData) setMetas(metasData);
    if (cuentasData) setCuentas(cuentasData);
    setLoading(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // Crear una nueva Meta/Propósito
  const handleCreateMeta = async (e) => {
    e.preventDefault();
    if (!nombreMeta || !montoTotal) return;

    const { error } = await supabase.from('metas').insert([
      {
        nombre_meta: nombreMeta,
        monto_total: parseFloat(montoTotal),
        fecha_limite: fechaLimite || null
      }
    ]);

    if (!error) {
      setNombreMeta('');
      setMontoTotal('');
      setFechaLimite('');
      setShowMetaModal(false);
      cargarDatos();
      alert('🎯 ¡Propósito creado con éxito! A cumplirlo.');
    }
  };

  // Registrar un abono a una meta específica
  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    if (!montoAbono || !cuentaId || !selectedMeta) return;

    // Buscamos el ID de la categoría especial 'Abono a Propósito'
    const { data: catData } = await supabase.from('categorias').select('id').eq('nombre', 'Abono a Propósito').single();
    
    if (!catData) {
      alert('Error: No se encontró la categoría "Abono a Propósito" en la base de datos.');
      return;
    }

    // Registramos el abono como un gasto/egreso real que alimenta la meta (vía el Trigger de la base de datos)
    const success = await createTransaction({
      userId: '00000000-0000-0000-0000-000000000000', // Reemplazar en el futuro con la sesión real del usuario logueado
      tipo: 'gasto',
      scope: scopeAbono, // 'eduin' o 'majo'
      categoriaId: catData.id,
      cuentaId: cuentaId,
      monto: montoAbono,
      descripcion: `Abono al propósito: ${selectedMeta.nombre_meta}`,
      metaId: selectedMeta.id
    });

    if (success) {
      setMontoAbono('');
      setShowAbonoModal(false);
      cargarDatos();
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 flex items-center gap-2">
            🎯 Nuestros Propósitos
          </h1>
          <p className="text-sm text-gray-500">Metas en pareja y sueños por cumplir.</p>
        </div>
        <button
          onClick={() => setShowMetaModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-purple-600/10 transition-all"
        >
          <Plus className="w-4 h-4" /> Nueva Meta
        </button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-400">Cargando metas...</p>
      ) : metas.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-gray-100 shadow-sm max-w-md mx-auto">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">No hay metas activas</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">¿Qué tal si proponen su primer objetivo juntos hoy?</p>
        </div>
      ) : (
        /* Cuadrícula de Metas */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metas.map((meta) => {
            const porcentaje = Math.min(Math.round((meta.monto_actual / meta.monto_total) * 100), 100);
            return (
              <div key={meta.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-lg text-gray-800">{meta.nombre_meta}</h3>
                    <span className="text-xs font-black bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full">
                      {porcentaje}%
                    </span>
                  </div>
                  
                  {meta.fecha_limite && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> Meta: {meta.fecha_limite}
                    </p>
                  )}

                  {/* Barra de Progreso */}
                  <div className="w-full bg-gray-100 h-3 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>

                  {/* Cifras */}
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Ahorrado</p>
                      <p className="font-extrabold text-emerald-600">${parseFloat(meta.monto_actual).toLocaleString('es-CO')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Objetivo</p>
                      <p className="font-extrabold text-gray-700">${parseFloat(meta.monto_total).toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                </div>

                {/* Botón para Abonar */}
                <button
                  onClick={() => {
                    setSelectedMeta(meta);
                    setShowAbonoModal(true);
                  }}
                  className="w-full mt-2 py-2.5 bg-gray-50 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 text-gray-700 hover:text-purple-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" /> Registrar Abono / Aporte
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NUEVA META */}
      {showMetaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateMeta} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4 relative">
            <button type="button" onClick={() => setShowMetaModal(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
            <h2 className="text-lg font-black text-gray-800">🎯 Proponer Nuevo Propósito</h2>
            
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">¿Qué queremos lograr?</label>
              <input type="text" placeholder="Ej: Televisor para la sala, Viaje de aniversario" value={nombreMeta} onChange={(e) => setNombreMeta(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" required />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Monto Total Necesario ($)</label>
              <input type="number" placeholder="Ej: 1000000" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" required />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Fecha Límite (Opcional)</label>
              <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" />
            </div>

            <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl shadow-md">Crear Meta Común</button>
          </form>
        </div>
      )}

      {/* MODAL: REGISTRAR ABONO */}
      {showAbonoModal && selectedMeta && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleRegistrarAbono} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4 relative">
            <button type="button" onClick={() => setShowAbonoModal(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">💰 Abonar a {selectedMeta.nombre_meta}</h2>
            
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">¿Cuánto vas a aportar?</label>
              <input type="number" placeholder="Ej: 50000" value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" required />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">¿Quién pone el dinero?</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button type="button" onClick={() => setScopeAbono('eduin')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${scopeAbono === 'eduin' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600'}`}>🙋‍♂️ Eduin</button>
                <button type="button" onClick={() => setScopeAbono('majo')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${scopeAbono === 'majo' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-600'}`}>🙋‍♀️ Majo</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">¿De qué cuenta sale el aporte?</label>
              <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl" required>
                <option value="">Selecciona la cuenta...</option>
                {cuentas
                  .map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.nombre_cuenta}</option>
                  ))
                }
              </select>
            </div>

            <button type="submit" disabled={txLoading} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50">
              {txLoading ? 'Procesando...' : '🚀 Confirmar Aporte'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
