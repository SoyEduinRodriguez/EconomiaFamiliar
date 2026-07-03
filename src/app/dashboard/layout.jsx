import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  return (
    // flex-col en móvil (uno abajo del otro), md:flex-row en PC (lado a lado)
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      
      {/* Barra de navegación responsiva */}
      <div className="w-full md:w-64 flex-shrink-0">
        <Navbar />
      </div>

      {/* Contenido principal que toma el resto del espacio libre */}
      <main className="flex-1 min-w-0 p-2 md:p-6 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
