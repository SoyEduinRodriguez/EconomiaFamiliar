export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-3xl font-black text-gray-900 mb-2">🏡 Economía Familiar</h1>
      <p className="text-gray-500 max-w-sm text-sm mb-6">Nuestra herramienta compartida para ordenar las finanzas del hogar.</p>
      <a href="/dashboard/hogar" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-md inline-block">
        Entrar al Dashboard
      </a>
    </div>
  );
}
