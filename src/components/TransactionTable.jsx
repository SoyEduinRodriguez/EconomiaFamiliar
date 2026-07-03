'use client';
import { AlertCircle } from 'lucide-react';

export default function TransactionTable({ transacciones, onActionSuccess }) {
  if (!transacciones || transacciones.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-xs max-w-xl mx-auto my-4">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        No hay transacciones registradas en este periodo.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-xl mx-auto my-4">
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <h3 className="font-bold text-gray-700 text-sm">Historial de Movimientos</h3>
      </div>
      <div className="p-4 divide-y divide-gray-100">
        {transacciones.map((tx) => (
          <div key={tx.id} className="py-3 flex justify-between items-center text-sm">
            <div>
              <p className="font-semibold text-gray-800">{tx.descripcion || 'Sin detalle'}</p>
              <p className="text-xs text-gray-400 uppercase font-bold">{tx.scope}</p>
            </div>
            <span className={`font-bold ${tx.tipo_transaccion === 'ingreso' ? 'text-emerald-600' : 'text-gray-700'}`}>
              {tx.tipo_transaccion === 'ingreso' ? '+' : '-'} ${parseFloat(tx.monto).toLocaleString('es-CO')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
