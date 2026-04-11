"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Receipt,
  Package,
  Layers,
  Settings,
  HelpCircle,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/proyectos", label: "Proyectos", icon: Briefcase },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/facturas", label: "Facturas", icon: Receipt },
  { href: "/catalogo", label: "Catálogo de insumos", icon: Package },
  { href: "/plantillas-apu", label: "Plantillas APU", icon: Layers },
];

const bottomItems = [
  { href: "/configuracion", label: "Configuración", icon: Settings },
  { href: "/ayuda", label: "Ayuda", icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 min-h-full shrink-0 bg-neutral">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center text-white text-sm font-bold bg-primary">
            A
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight">Project Hub</div>
            <div className="text-gray-400 text-xs leading-tight">AEC COLOMBIA</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                active ? "bg-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* New project button */}
      <div className="px-3 pb-4">
        <Link
          href="/proyectos/nuevo"
          className="flex items-center justify-center gap-2 w-full py-2 rounded text-sm font-medium text-white bg-primary transition-colors hover:bg-primary/90"
        >
          <Plus size={16} />
          <span>Nuevo Proyecto</span>
        </Link>
      </div>

      {/* Bottom nav */}
      <div className="px-2 pb-4 space-y-0.5 border-t border-white/10 pt-4">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Icon size={16} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
