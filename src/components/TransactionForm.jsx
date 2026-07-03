'use client';
import { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TransactionForm({ isOpen, onClose, defaultScope, onActionSuccess }) {
  const [activeTab, setActiveTab] = useState('gasto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hoyLocal = new Date().toLocaleDateString('sv-SE');

  // Estados del Formulario
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [scope, setScope] = useState(defaultScope || 'hogar');
  const [fecha, setFecha] = useState(hoyLocal);
  const [categoria, setCategoria] = useState('');
  const [motivoIngreso, setMotivoIngreso] = useState('');
  const [cuentaInvolucrada, setCuentaInvolucrada] = useState('');
  const [pagadoPor, setPagadoPor] = useState(''); // <-- Nuevo estado lógico

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Lógica inteligente: Si el scope es personal, el pagador es el mismo dueño
    const responsableDinero = scope === 'hogar' ? pagadoPor : scope;

    const dataToSubmit = {
      monto: parseFloat(monto),
      descripcion,
      scope,
      tipo_transaccion: activeTab,
      fecha: fecha,
      categoria: activeTab === 'gasto' ? categoria : null,
      cuenta_pago: activeTab === 'gasto' ? cuentaInvolucrada : null,
      motivo_ingreso: activeTab === 'ingreso' ? motivoIngreso : null,
      pagado_por: activeTab === 'gasto' ? responsableDinero : null, // Guardamos quién financió el gasto
    };

    try {
      const { error: dbError } = await supabase
        .from('transacciones')
        .insert([dataToSubmit]);

      if (dbError) throw dbError;

      // Reset total
      setMonto('');
      setDescripcion('');
      setCategoria('');
      setMotivoIngreso('');
      setCuentaInvolucrada('');
      setPagadoPor('');
      setFecha(hoyLocal);
      
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
        
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">Registrar Movimiento</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-gray-100 flex gap-2 m-4 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('gasto')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'gasto' ? 'bg-gray-800 text-white' : 'text-gray-500'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-red-400" />
            Registrar Gasto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingreso')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ingreso' ? 'bg-emerald-600 text-white' : 'text-gray-500'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-300" />
            Registrar Ingreso
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monto ($)</label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${activeTab === 'ingreso' ? 'text-emerald-500' : 'text-gray-400'}`}>
                  $
                </span>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
            <input
              type="text"
              required
              placeholder={activeTab === 'gasto' ? "Ej. Compras del Éxito" : "Ej. Pago de nómina"}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ámbito (Scope)</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium focus:outline-none"
            >
              <option value="hogar">Hogar / Gastos Comunes</option>
              <option value="eduin">Eduin (Personal)</option>
              <option value="majo">Majo (Personal)</option>
            </select>
          </div>

          {/* CONDICIONAL: GASTO */}
          {activeTab === 'gasto' && (
            <div className="space-y-4 animate-slideDown">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoría</label>
                  <select
                    required
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 bg-white rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="">Selecciona...</option>
                    <option value="mercado">Mercado</option>
                    <option value="servicios">Servicios</option>
                    <option value="renta">Renta</option>
                    <option value="transporte">Transporte</option>
                    <option value="entretenimiento">Entretenimiento</option>
                    <option value="salud">Salud</option>
                    <option value="otros">Otros Gastos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">¿Cómo se pagó?</label>
                  <select
                    required
                    value={cuentaInvolucrada}
                    onChange={(e) => setCuentaInvolucrada(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 bg-white rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="">Selecciona...</option>
                    <option value="nequi">Nequi</option>
                    <option value="bancolombia">Bancolombia</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta de Crédito</option>
                  </select>
                </div>
              </div>

              {/* LÓGICA DE FINANCIAMIENTO SÓLO SI ES GASTO DE HOGAR */}
              {scope === 'hogar' && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 animate-fadeIn">
                  <label className="block text-xs font-bold text-amber-800 uppercase mb-1">¿Quién puso el dinero?</label>
                  <select
                    required
                    value={pagadoPor}
                    onChange={(e) => setPagadoPor(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 bg-white rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="">Selecciona quién pagó...</option>
                    <option value="eduin">Eduin sacó de su bolsillo</option>
                    <option value="majo">Majo sacó de su bolsillo</option>
                    <option value="fondo_comun">Salió del Fondo Común de la casa</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* CONDICIONAL: INGRESO */}
          {activeTab === 'ingreso' && (
            <div className="animate-slideDown">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Motivo del Ingreso</label>
              <select
                required
                value={motivoIngreso}
                onChange={(e) => setMotivoIngreso(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium focus:outline-none"
              >
                <option value="">Selecciona el tipo de ingreso...</option>
                <option value="salario">Salario Base</option>
                <option value="extras">Horas Extras / Bonos</option>
                <option value="independiente">Trabajo Independiente</option>
                <option value="transferencia">Transferencia Familiar</option>
                <option value="otros">Otros Ingresos</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all mt-2 ${
              loading ? 'opacity-50' : ''
            } ${activeTab === 'ingreso' ? 'bg-emerald-600' : 'bg-gray-800'}`}
          >
            {loading ? 'Guardando...' : activeTab === 'ingreso' ? 'Guardar Ingreso' : 'Guardar Gasto'}
          </button>
        </form>
      </div>
    </div>
  );
}
