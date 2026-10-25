import React from 'react';
import { Package, User as UserIcon, MapPin, Heart, LogOut, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CustomerLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children, activePath, onNavigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Customer Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/')}
              className="group flex items-center gap-2 text-[11px] uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Бутик</span>
            </button>
            <span className="text-zinc-800">/</span>
            <button onClick={() => onNavigate('/')} className="flex items-center gap-2 text-left">
              <span className="font-serif tracking-widest text-sm font-bold text-white">UMAR</span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-xs">
                Клиентский кабинет
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 text-zinc-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-zinc-200">{user?.fullName || 'Покупатель'}</span>
              <span className="text-zinc-600 font-mono text-[11px]">({user?.email})</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors rounded-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Portal Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Customer Navigation Sidebar */}
          <aside className="md:col-span-1 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 p-2 space-y-1">
              <button
                onClick={() => onNavigate('/account')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs tracking-wider uppercase font-medium transition-colors text-left ${
                  activePath === '/account'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Профиль и данные</span>
              </button>

              <button
                onClick={() => onNavigate('/account/orders')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs tracking-wider uppercase font-medium transition-colors text-left ${
                  activePath.startsWith('/account/orders')
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Мои заказы</span>
              </button>

              <button
                onClick={() => onNavigate('/account/addresses')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs tracking-wider uppercase font-medium transition-colors text-left ${
                  activePath === '/account/addresses'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Адреса доставки</span>
              </button>

              <button
                onClick={() => onNavigate('/account/favorites')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs tracking-wider uppercase font-medium transition-colors text-left ${
                  activePath === '/account/favorites'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Избранное</span>
              </button>
            </div>

            <div className="p-5 bg-zinc-950/60 border border-zinc-900 space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Консьерж-сервис</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Персональная консультация по подбору размеров, индивидуальный пошив и экспресс-примерка по Алматы.
              </p>
              <div className="pt-2 border-t border-zinc-900">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 block">Прямая линия бутика:</span>
                <span className="font-mono text-xs font-medium text-zinc-300">+7 (727) 355-12-80</span>
              </div>
            </div>
          </aside>

          {/* Customer Content Slot */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
