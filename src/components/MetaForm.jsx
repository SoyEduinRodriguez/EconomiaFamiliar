'use client';
import { useState } from 'react';
import { X, Target, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MetaForm({ isOpen, onClose, onActionSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('metas')
        .select('*') // Primero asegurar la inserción limpia
        .insert([
          {
            nombre_meta: nombre,
            monto_total: parseFloat(montoObjetivo),
            monto_actual: 0.00, // Usamos tu columna nativa de acumulado
            fecha_limite: fechaLimite || null,
            activa: true // Usamos tu booleano por defecto
          }
        ]);

      if (dbError) throw dbError;

      setNombre('');
      setMontoObjetivo('');
      setFechaLimite('');
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear la meta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
        
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Proponer Nueva Meta
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">¿Cuál es el objetivo o sueño?</label>
            <input
              type="text"
              required
              placeholder="Ej. Viaje de fin de año o Inicial del carro"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monto Meta ($)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={montoObjetivo}
                onChange={(e) => setMontoObjetivo(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha Límite (Opcional)</label>
              <input
                type="date"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-md transition-all mt-2"
          >
            {loading ? 'Creando...' : 'Establecer Objetivo'}
          </button>
        </form>
      </div>
    </div>
  );
}
