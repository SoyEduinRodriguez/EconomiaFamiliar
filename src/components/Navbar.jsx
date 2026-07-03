'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Users, Target, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Eduin', href: '/dashboard/eduin', icon: User, color: 'text-blue-500' },
    { name: 'Majo', href: '/dashboard/majo', icon: User, color: 'text-pink-500' },
    { name: 'Hogar', href: '/dashboard/hogar', icon: Users, color: 'text-emerald-500' },
    { name: 'Metas', href: '/dashboard/metas', icon: Target, color: 'text-purple-500' },
  ];

  return (
    <>
      {/* NAVEGACIÓN PARA ESCRITORIO (Sidebar Izquierdo) */}
      <aside className="hidden md:flex flex-col w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-100 p-6 shadow-sm">
        <div className="mb-8">
          <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            📊 <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">FinanzasHogar</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Nuestra economía bajo control</p>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-md shadow-gray-900/10'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* NAVEGACIÓN PARA MÓVIL (Barra Inferior Flotante) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 pb-5 pt-2 flex justify-around items-center z-50 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[60px] py-1 transition-all ${
                isActive ? 'scale-110' : 'opacity-60'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? 'bg-gray-100' : ''}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
