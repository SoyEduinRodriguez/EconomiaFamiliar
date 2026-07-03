import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      {/* Menú de navegación adaptativo (Sidebar en PC, barra inferior en móvil) */}
      <Navbar />

      {/* Contenedor principal donde se renderiza cada pestaña (hogar, eduin, majo, metas) */}
      <main className="md:pl-64 min-h-screen pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
