'use client';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-sm w-full">
        <h2 className="text-xl font-black text-gray-800">Iniciar Sesión</h2>
        <p className="text-sm text-gray-400 mt-1 mb-6">Módulo de autenticación en desarrollo.</p>
        <a href="/dashboard/hogar" className="w-full block py-3 bg-blue-600 text-white font-bold rounded-xl shadow-sm text-sm">
          Ir al Dashboard Temporal
        </a>
      </div>
    </div>
  );
}
