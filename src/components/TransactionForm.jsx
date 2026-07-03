'use client';
import { useState, useEffect } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { supabase } from '@/lib/supabase';

export default function TransactionForm({ userId, onTransactionSuccess }) {
  const { createTransaction, loading, error: txError } = useTransactions();
  
  // Estados para cargar selectores desde Supabase
  const [categorias, setCategorias] = useState([]);
  const [cuentas, setCuentas] = useState([]);

  // Estados del formulario
  const [tipo, setTipo] = useState('gasto'); // 'gasto' o 'ingreso'
  const [scope, setScope] = useState('hogar'); // 'eduin', 'majo' o 'hogar'
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Cargar categorías y cuentas al montar el componente
  useEffect(() => {
    async function loadFormOptions() {
      try {
        const { data: catData } = await supabase.from('categorias').select('*').order('nombre', { ascending: true });
        const { data: cuentaData } = await supabase.from('cuentas_bancarias').select('*');
        
        if (catData) setCategorias(catData);
        if (cuentaData) setCuentas(cuentaData);
      } catch (err) {
        console.error("Error cargando opciones del formulario:", err);
      }
    }
    loadFormOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !categoriaId || !cuentaId) {
      alert('Por favor completa los campos obligatorios: Monto, Categoría y Cuenta.');
      return;
    }

    const success = await createTransaction({
      userId: userId || '00000000-0000-0000-0000-000000000000', // ID temporal si no hay sesión activa aún
      tipo,
      scope,
      categoriaId,
      cuentaId,
      monto,
      descripcion
    });

    if (success) {
      setMonto('');
      setDescripcion('');
      alert('¡Registro guardado con éxito! 🚀');
      if (onTransactionSuccess) onTransactionSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-2xl shadow-md max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-800 text-center">Registrar Movimiento</h2>

      {/* Selector Rápido Tipo Transacción */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setTipo('gasto')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tipo === 'gasto' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600'}`}
        >
          💸 Gasto
        </button>
        <button
          type="button"
          onClick={() => setTipo('ingreso')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tipo === 'ingreso' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600'}`}
        >
          💰 Ingreso
        </button>
      </div>

      {/* Selector de Propietario / Scope */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">¿De quién o para quién es?</label>
        <select 
          value={scope} 
          onChange={(e) => setScope(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hogar">🏡 Hogar (Compartido)</option>
          <option value="eduin">🙋‍♂️ Eduin</option>
          <option value="majo">🙋‍♀️ Majo</option>
        </select>
      </div>

      {/* Campo de Monto */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Valor ($)</label>
        <input
          type="number"
          placeholder="Ej: 50000"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Selector de Categorías con blindaje ante arreglos vacíos o nulos */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Categoría</label>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona una categoría...</option>
          {categorias && categorias.length > 0 && categorias
            .filter(cat => scope === 'hogar' ? cat.tipo !== 'individual' : cat.tipo !== 'hogar')
            .map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))
          }
        </select>
      </div>

      {/* Selector de Cuenta con blindaje ante arreglos vacíos o nulos */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">¿Con qué cuenta se pagó?</label>
        <select
          value={cuentaId}
          onChange={(e) => setCuentaId(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona la cuenta...</option>
          {cuentas && cuentas.length > 0 && cuentas.map(ct => (
            <option key={ct.id} value={ct.id}>{ct.nombre_cuenta}</option>
          ))}
        </select>
      </div>

      {/* Descripción Breve */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Detalle (Opcional)</label>
        <input
          type="text"
          placeholder="Ej: Compras del mes, cena familiar"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {txError && <p className="text-red-500 text-xs text-center">{txError}</p>}

      {/* Botón Guardar */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
      >
        {loading ? 'Guardando...' : '💾 Guardar Transacción'}
      </button>
    </form>
  );
}
