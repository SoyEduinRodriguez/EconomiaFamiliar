'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Users, Target, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  // Mapeo limpio de tus 4 secciones
  const menuItems = [
    { name: 'Eduin', href: '/dashboard/eduin', icon: User },
    { name: 'Majo', href: '/dashboard/majo', icon: User },
    { name: 'Hogar', href: '/dashboard/hogar', icon: Users },
    { name: 'Metas', href: '/dashboard/metas', icon: Target },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-4 flex flex-col justify-between">
      <div className="space-y-6">
        
        {/* Logotipo */}
        <div className="p-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-black text-gray-800 tracking-tight">
              Finanzas<span className="text-emerald-500">Hogar</span>
            </h1>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
            Nuestra economía bajo control
          </p>
        </div>

        {/* Enlaces con Link nativo de Next.js */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Valida con precisión quirúrgica si estás parado en esta pestaña
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-gray-50 pt-4">
        <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
          v1.0.0 Stable
        </p>
      </div>
    </aside>
  );
}
