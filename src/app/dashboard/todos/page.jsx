'use client';
import { useState, useEffect } from 'react';
import { Checklist, PlusCircle, Trash2, CheckCircle2, Circle, RefreshCw, ShoppingCart, Home, ListTodo } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ToDoPage() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados del formulario
  const [nuevaTarea, setNuevaTarea] = useState('');
  const [categoria, setCategoria] = useState('mercado');
  const [guardando, setGuardando] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (err) {
      console.error('Error cargando tareas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    setGuardando(true);

    try {
      const { error } = await supabase
        .from('todos')
        .insert([{ tarea: nuevaTarea.trim(), categoria_todo: categoria, completada: false }]);

      if (error) throw error;
      setNuevaTarea('');
      fetchTodos();
    } catch (err) {
      alert('Error al crear tarea: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleCompletada = async (id, estadoActual) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completada: !estadoActual })
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (err) {
      alert('Error al actualizar tarea: ' + err.message);
    }
  };

  const handleEliminarTarea = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (err) {
      alert('Error al borrar: ' + err.message);
    }
  };

  // Separar listas localmente
  const pendientes = todos.filter(t => !t.completada);
  const completadas = todos.filter(t => t.completada);

  const getIconoCategoria = (cat) => {
    if (cat === 'mercado') return <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />;
    if (cat === 'hogar') return <Home className="w-3.5 h-3.5 text-blue-500" />;
    return <ListTodo className="w-3.5 h-3.5 text-purple-500" />;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-gray-800">Pendientes del Hogar</h2>
          <p className="text-xs text-gray-400 font-medium">Lista compartida para mercado y tareas</p>
        </div>
        <button onClick={fetchTodos} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Formulario rápido de inserción */}
      <form onSubmit={handleCrearTarea} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="Ej. Comprar leche deslactosada, pagar el internet..."
            value={nuevaTarea}
            onChange={(e) => setNuevaTarea(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-2">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 bg-gray-50 focus:outline-none"
            >
              <option value="mercado">🛒 Mercado</option>
              <option value="hogar">🏡 Tareas Hogar</option>
              <option value="otros">📌 Otros</option>
            </select>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 justify-center whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              Añadir
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-10 text-sm text-gray-400 font-medium">Sincronizando notas...</div>
      ) : (
        <div className="space-y-6">
          
          {/* SECCIÓN PENDIENTES */}
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
              Por Hacer ({pendientes.length})
            </h3>
            {pendientes.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                ¡Todo al día! No hay tareas pendientes. 🎉
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-xs overflow-hidden">
                {pendientes.map((todo) => (
                  <div key={todo.id} className="p-3.5 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3 pr-2">
                      <button 
                        onClick={() => handleToggleCompletada(todo.id, todo.completada)}
                        className="text-gray-300 hover:text-emerald-500 transition-colors flex-shrink-0"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-gray-800 break-words">{todo.tarea}</p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black text-gray-400 uppercase bg-gray-100 rounded-md">
                          {getIconoCategoria(todo.categoria_todo)}
                          {todo.categoria_todo}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEliminarTarea(todo.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN COMPLETADAS */}
          {completadas.length > 0 && (
            <div className="opacity-60 pt-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                Listas / Listas del Carrito ({completadas.length})
              </h3>
              <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                {completadas.map((todo) => (
                  <div key={todo.id} className="p-3 flex justify-between items-center bg-gray-100/30">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleToggleCompletada(todo.id, todo.completada)}
                        className="text-emerald-600 flex-shrink-0"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <p className="text-sm font-medium text-gray-500 line-through">{todo.tarea}</p>
                    </div>
                    <button 
                      onClick={() => handleEliminarTarea(todo.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
