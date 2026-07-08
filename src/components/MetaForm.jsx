'use client';
import { useState } from 'react';
import { X, Target, Trophy, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MetaForm({ isOpen, onClose, onActionSuccess }) {
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [tipoMeta, setTipoMeta] = useState('normal'); // 'normal' o 'reto_flexible'
  const [plazoMeses, setPlazoMeses] = useState('6'); // '6' o '12' meses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // 🧮 Generador matemático de casillas según el monto y meses deseados
  const generarCasillasDinamicas = (montoTotal, meses) => {
    const numCasillas = meses === 12 ? 100 : 50;
    let casillas = [];
    
    // Calculamos una progresión aritmética básica para que no todas las casillas sean iguales
    // Suma de progresión: S = (n / 2) * (2*a + (n-1)*d)
    // Para simplificar y que sean valores amigables en pesos colombianos, calculamos una base aproximada
    const valorPromedio = montoTotal / numCasillas;
    
    for (let i = 1; i <= numCasillas; i++) {
      // Creamos una ligera variación (+/-) alrededor del promedio para darle dinamismo al cartón
      let factor = (i - (numCasillas / 2)) * (valorPromedio * 0.01);
      let valorCasilla = Math.round((valorPromedio + factor) / 50) * 50; // Redondeado a los $50 pesos más cercanos
      
      if (valorCasilla <= 0) valorCasilla = 100; // Evitar valores negativos o cero
      casillas.push(valorCasilla);
    }

    // Ajustar milimétricamente la última casilla para que la suma cierre EXACTA al monto pedido
    const sumaActual = casillas.reduce((a, b) => a + b, 0);
    const diferencia = montoTotal - sumaActual;
    if (casillas.length > 0) {
      casillas[casillas.length - 1] += diferencia;
    }

    return casillas;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const esReto = tipoMeta === 'reto_flexible';
    const montoFinal = parseFloat(montoObjetivo);
    const mesesInt = parseInt(plazoMeses);
    const nombreFinal = esReto ? `${nombre} 🎯 (Alcancía ${mesesInt}M)` : nombre;

    if (isNaN(montoFinal) || montoFinal <= 0) {
      setError('Por favor ingresa un monto válido mayor a cero.');
      setLoading(false);
      return;
    }

    try {
      // 1. Insertar Meta Principal
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

      // 2. Si es alcancía interactiva, generar sus N casillas numéricas personalizadas
      if (esReto && metaCreada) {
        const listadoValores = generarCasillasDinamicas(montoFinal, mesesInt);
        const filasCasillas = listadoValores.map(v => ({
          meta_id: metaCreada.id,
          valor: v,
          tachada: false
        }));

        const { error: errorCasillas } = await supabase
          .from('casillas_metas')
          .insert(filasCasillas);

        if (errorCasillas) throw errorCasillas;
      }

      setNombre('');
      setMontoObjetivo('');
      setFechaLimite('');
      setTipoMeta('normal');
      if (onActionSuccess) onActionSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear el propósito');
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

          {/* Selector de Modalidad */}
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
                onClick={() => setTipoMeta('reto_flexible')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                  tipoMeta === 'reto_flexible' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" /> Alcancía Inteligente
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">¿Cómo se llamará este sueño?</label>
            <input
              type="text"
              required
              placeholder="Ej. Viaje, Moto, CDT Pareja..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">¿Cuánto dinero quieres ahorrar ($)?</label>
            <input
              type="number"
              required
              placeholder="Ej. 1500000"
              value={montoObjetivo}
              onChange={(e) => setMontoObjetivo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
            />
          </div>

          {tipoMeta === 'reto_flexible' && (
            <div className="space-y-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <div>
                <label className="block text-[9px] font-black text-amber-800 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Plazo Máximo de Ahorro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlazoMeses(6)}
                    className={`py-1.5 px-2 text-xs font-black rounded-lg border ${
                      plazoMeses === 6 ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-amber-200'
                    }`}
                  >
                    6 Meses (50 celdas)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlazoMeses(12)}
                    className={`py-1.5 px-2 text-xs font-black rounded-lg border ${
                      plazoMeses === 12 ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-amber-200'
                    }`}
                  >
                    1 Año (100 celdas)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fecha Límite Visual (Opcional)</label>
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
            className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all"
          >
            {loading ? 'Calculando celdas matemáticas...' : 'Crear Alcancía Personalizada'}
          </button>
        </form>
      </div>
    </div>
  );
}
