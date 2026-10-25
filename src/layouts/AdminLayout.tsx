import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Tag,
  Users,
  Layers,
  History,
  ShieldCheck,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activePath, onNavigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-400 hover:text-white font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              В магазин
            </button>
            <span className="text-zinc-800">|</span>
            <img
              src="/assets/aistudio/_____cecc8cff.jpg"
              alt="UMAR"
              className="h-7 w-auto bg-black px-1.5 py-0.5 rounded"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">Панель управления владельца</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-950 text-red-300 border border-red-900">
                OWNER · ROOT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-400 hidden sm:inline">{user?.fullName} ({user?.email})</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            <button
              onClick={() => onNavigate('/admin')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activePath === '/admin'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Аналитика KPI
            </button>

            <button
              onClick={() => onNavigate('/admin/inventory')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activePath === '/admin/inventory'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Boxes className="w-4 h-4" />
              Склад и приход
            </button>

            <button
              onClick={() => onNavigate('/admin/products')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activePath === '/admin/products'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Tag className="w-4 h-4" />
              Товары и цены
            </button>

            <button
              onClick={() => onNavigate('/admin/employees')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activePath === '/admin/employees'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Сотрудники и роли
            </button>

            <button
              onClick={() => onNavigate('/admin/integrations')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activePath === '/admin/integrations'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Интеграции (Kaspi, TG)
            </button>

            <button
              onClick={() => onNavigate('/admin/audit-log')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activePath === '/admin/audit-log'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <History className="w-4 h-4" />
              Журнал аудита
            </button>

            <button
              onClick={() => onNavigate('/admin/security')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activePath === '/admin/security'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Центр безопасности
            </button>
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {children}
      </main>
    </div>
  );
};
