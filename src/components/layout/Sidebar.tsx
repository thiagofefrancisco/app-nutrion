import React from 'react';
import {
  LayoutDashboard,
  Users,
  LogOut,
  User,
  ShieldCheck,
  ChevronRight,
  Database,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import type { NutricionistaUser } from '@/types/auth';

export type NavTab = 'dashboard' | 'pacientes';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: NutricionistaUser;
  onLogout: () => void;
  isLoggingOut?: boolean;
  totalPacientes?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  isLoggingOut = false,
  totalPacientes = 0,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pacientes' as NavTab,
      label: 'Pacientes',
      icon: Users,
      badge: totalPacientes > 0 ? totalPacientes : null,
    },
  ];

  return (
    <aside className="w-64 lg:w-72 bg-white/95 backdrop-blur-md border-r border-[#EBDAD2] flex flex-col justify-between h-screen sticky top-0 z-40 select-none shadow-sm">
      {/* Top Section: Logo NutriOn */}
      <div className="p-6 border-b border-[#F0E4DC]">
        <div className="flex items-center justify-start">
          <Logo size="sm" showSubtitle={false} className="items-start text-left" />
        </div>
        <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF1E4] border border-[#D7A49A]/30 w-fit">
          <div className="w-2 h-2 rounded-full bg-[#999B84] animate-pulse" />
          <span className="text-[11px] font-medium text-[#7A6963]">
            Neon PostgreSQL Conectado
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#999B84]">
          Menu Principal
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-[#999B84] text-white shadow-md shadow-[#999B84]/25'
                  : 'text-[#5C4D47] hover:bg-[#FFF1E4] hover:text-[#2C211E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-[#999B84] group-hover:text-[#2C211E]'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#FFF1E4] text-[#999B84] border border-[#EBDAD2]'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isActive && item.badge === null && (
                <ChevronRight className="w-4 h-4 text-white/80" />
              )}
            </button>
          );
        })}

        {/* Informative RLS Security Card */}
        <div className="mt-8 mx-1 p-3.5 rounded-2xl bg-[#FFF1E4]/70 border border-[#D7A49A]/30 text-left">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-[#999B84]" />
            <span className="text-xs font-bold text-[#2C211E]">RLS Ativo</span>
          </div>
          <p className="text-[11px] text-[#7A6963] leading-relaxed">
            Seus pacientes e consultas são isolados exclusivamente para o seu perfil no Neon.
          </p>
        </div>
      </nav>

      {/* Bottom Section: Nutricionista Profile & Logout */}
      <div className="p-4 border-t border-[#F0E4DC] bg-[#FFFBF8]/80">
        <div className="flex items-center gap-3 p-2 rounded-2xl">
          <div className="w-10 h-10 rounded-2xl bg-[#999B84] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-[#2C211E] truncate">{user.name}</p>
            <p className="text-xs text-[#7A6963] truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-[#935A50] hover:bg-[#FBEBE7] hover:text-[#B97F74] transition-colors border border-transparent hover:border-[#D7A49A]/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isLoggingOut ? 'Saindo...' : 'Encerrar Sessão'}</span>
        </button>
      </div>
    </aside>
  );
};
