'use client';
import { useState } from 'react';
import { X, Target, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MetaForm({ isOpen, onClose, onActionSuccess }) {
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [tipoMeta, setTipoMeta] = useState('normal'); // 'normal' o 'reto_1m'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Función para generar los valores exactos del cartón de 1 millón
  const generarValoresReto1M = () => {
    let valores = [];
    // Columnas base progresivas de la imagen
    const bases = [50, 1050, 2050, 3050, 4050, 5050, 6050, 7050, 8050, 9050];
    
    // Generar las 20 filas por cada columna base
    for (let fila = 0; fila < 20; fila++) {
      bases.forEach((base) => {
        // En la última fila (fila 19), los valores cierran en miles redondos como en la imagen
        if (fila === 19) {
          const finales = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
          const colIndex = bases.indexOf(base);
          valores.push(finales[colIndex]);
        } else {
          // Filas intermedias incrementan de a 50 pesos hacia abajo
          valores.push(base + (fila * 50));
        }
      });
    }
    return valores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Si es reto de 1 millón, el monto se bloquea automáticamente en $1.000.000
    const esReto = tipoMeta === 'reto_1m';
    const montoFinal = esReto ? 1000000 : parseFloat(montoObjetivo);
    const nombreFinal = esReto ? `${nombre} 🎯 (Reto 1M)` : nombre;

    try {
      // 1. Insertar la Meta principal
      const { data: metaCreada, error: dbError } = await supabase
        .from('metas')
        .insert([
          {
            nombre_meta: nombreFinal,
            monto_total: montoFinal,
            monto_actual: 0.00,
            fecha_limite: fechaLimite || null,
            activa: true
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Si es un reto estilo alcancía, poblar la tabla de casillas
      if (esReto && metaCreada) {
        const listadoValores = generarValoresReto1M();
        const filasCasillas = listadoValores.map(v => ({
          meta_id: metaCreada.id,
          valor: v,
          tachada: false
        }));

        // Insertar en bloques para evitar saturar la API
        const { error: errorCasillas } = await supabase
          .from('casillas_metas')
          .insert(filasCasillas);

        if (errorCasillas) throw errorCasillas;
      }

      // Limpiar y cerrar
      setNombre('');
      setMontoObjetivo('');
      setFechaLimite('');
      setTipoMeta('normal');
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear la meta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-xl border border-gray-100">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-gray-700 uppercase">Establecer Propósito</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl">{error}</div>}

          {/* Selector de Tipo de Meta */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Modalidad de Ahorro</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoMeta('normal')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                  tipoMeta === 'normal' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> Normal
              </button>
              <button
                type="button"
                onClick={() => setTipoMeta('reto_1m')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                  tipoMeta === 'reto_1m' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" /> Reto 1 Millón
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">¿Cómo se llamará este sueño?</label>
            <input
              type="text"
              required
              placeholder="Ej. Viaje a San Andrés, Computador nuevo..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none"
            />
          </div>

          {tipoMeta === 'normal' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">¿Cuánto dinero requieres ($)?</label>
              <input
                type="number"
                required={tipoMeta === 'normal'}
                placeholder="0"
                value={montoObjetivo}
                onChange={(e) => setMontoObjetivo(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
              />
            </div>
          )}

          {tipoMeta === 'reto_1m' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
              <p className="text-[11px] text-amber-800 font-bold">
                💰 Reto Alcancía activado: Se autogenerará un tablero interactivo con un valor cerrado de **$1.000.000** a seis meses.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha Límite (Opcional)</label>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            {loading ? 'Inicializando propósito...' : 'Comenzar a Ahorrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
