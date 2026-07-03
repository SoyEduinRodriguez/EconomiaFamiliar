import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  return (
    // 'flex min-h-screen' obliga a que el menú y el contenido se alineen horizontalmente
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Barra lateral estática a la izquierda */}
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      {/* Contenido principal a la derecha que se adapta al resto de la pantalla */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
