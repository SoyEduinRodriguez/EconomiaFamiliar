'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Users, Target, LayoutDashboard, ListTodo } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const menuItems = [
  
    { name: 'Eduin', href: '/dashboard/eduin', icon: User },
    { name: 'Majo', href: '/dashboard/majo', icon: User },
    { name: 'Hogar', href: '/dashboard/hogar', icon: Users },
    { name: 'Metas', href: '/dashboard/metas', icon: Target },
    { name: 'Lista', href: '/dashboard/todos', icon: ListTodo },
  ];

  return (
    // md:min-h-screen y md:w-64 en PC. En móvil es una barra horizontal fluida
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-100 p-4 flex flex-col md:justify-between">
      <div className="space-y-4 md:space-y-6">
        
        {/* Logotipo (Oculto o compacto en móvil para ahorrar espacio si quieres) */}
        <div className="flex items-center justify-between md:block p-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-500" />
            <h1 className="text-base md:text-xl font-black text-gray-800 tracking-tight">
              Finanzas<span className="text-emerald-500">Hogar</span>
            </h1>
          </div>
          <span className="md:hidden text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">v1.0</span>
        </div>

        {/* Menú: Línea horizontal en móvil, lista vertical en PC */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm whitespace-nowrap transition-all flex-1 md:flex-none justify-center md:justify-start ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="hidden md:block p-2 border-t border-gray-50 pt-4">
        <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
          v1.0.0 Stable
        </p>
      </div>
    </aside>
  );
}
