import React, { useState } from 'react';
import { ShieldCheck, ChevronUp, ChevronDown, UserCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface DevPersonaBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const DevPersonaBar: React.FC<DevPersonaBarProps> = ({ currentPath, onNavigate }) => {
  const { user, switchDemoRole, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (role: UserRole) => {
    setSwitching(true);
    await switchDemoRole(role);
    setSwitching(false);

    // Auto-navigate to respective area
    if (role === 'OWNER') onNavigate('/admin');
    else if (role === 'MANAGER') onNavigate('/staff/orders');
    else if (role === 'WAREHOUSE') onNavigate('/staff/pickups');
    else onNavigate('/account');
  };

  const handleGuest = async () => {
    setSwitching(true);
    await logout();
    setSwitching(false);
    onNavigate('/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 text-white border-t border-zinc-800 text-xs font-mono shadow-2xl backdrop-blur-md">
      {/* Slim Header */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400 font-semibold tracking-wider uppercase text-[10px]">
            Security & Persona Switcher (Dev Mode)
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300">
            Активный: <strong className="text-white">{user?.fullName || 'Гость (Не авторизован)'}</strong>
            {user && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-zinc-800 text-zinc-300 text-[10px] uppercase font-bold border border-zinc-700">
                {user.roles.join(', ')}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Route Jumpers to test 403 access barriers */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => onNavigate('/')}
              className={`px-2 py-0.5 border ${currentPath === '/' ? 'bg-white text-black font-bold' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
            >
              / Магазин
            </button>
            <button
              onClick={() => onNavigate('/account')}
              className={`px-2 py-0.5 border ${currentPath.startsWith('/account') ? 'bg-white text-black font-bold' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
            >
              /account
            </button>
            <button
              onClick={() => onNavigate('/staff')}
              className={`px-2 py-0.5 border ${currentPath.startsWith('/staff') ? 'bg-white text-black font-bold' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
            >
              /staff
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className={`px-2 py-0.5 border ${currentPath.startsWith('/admin') ? 'bg-white text-black font-bold' : 'border-zinc-700 text-zinc-400 hover:text-white'}`}
            >
              /admin
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-zinc-400 hover:text-white flex items-center gap-1 ml-2"
          >
            <span className="text-[10px] uppercase">{isExpanded ? 'Скрыть' : 'Сменить роль'}</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Persona Switcher */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-4 py-3 border-t border-zinc-800 bg-zinc-950/90 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <button
            disabled={switching}
            onClick={() => handleSwitch('CUSTOMER')}
            className={`p-2 border transition-all ${
              user?.roles?.includes('CUSTOMER') && !user?.roles?.includes('OWNER')
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <span className="font-bold block">Покупатель</span>
            <span className="text-[10px] text-zinc-500 block">customer@gmail.com</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Видит только магазин и личный кабинет</span>
          </button>

          <button
            disabled={switching}
            onClick={() => handleSwitch('MANAGER')}
            className={`p-2 border transition-all ${
              user?.roles?.includes('MANAGER')
                ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <span className="font-bold block">Менеджер</span>
            <span className="text-[10px] text-zinc-500 block">manager@umarmens.kz</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Заказы в работе, CRM диалоги (нет цен/финансов)</span>
          </button>

          <button
            disabled={switching}
            onClick={() => handleSwitch('WAREHOUSE')}
            className={`p-2 border transition-all ${
              user?.roles?.includes('WAREHOUSE')
                ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <span className="font-bold block">Кладовщик</span>
            <span className="text-[10px] text-zinc-500 block">warehouse@umarmens.kz</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Комплектация, сканирование SKU, приёмка</span>
          </button>

          <button
            disabled={switching}
            onClick={() => handleSwitch('OWNER')}
            className={`p-2 border transition-all ${
              user?.roles?.includes('OWNER')
                ? 'border-red-500 bg-red-950/40 text-red-300'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <span className="font-bold block">Владелец (Owner)</span>
            <span className="text-[10px] text-zinc-500 block">owner@umarmens.kz</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Полный доступ: KPI, склад, цены, сотрудники</span>
          </button>

          <button
            disabled={switching}
            onClick={handleGuest}
            className="p-2 border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white"
          >
            <span className="font-bold block text-zinc-300">Гость</span>
            <span className="text-[10px] text-zinc-500 block">Без авторизации</span>
            <span className="text-[9px] text-zinc-600 block mt-0.5">Публичный посетитель витрины</span>
          </button>
        </div>
      )}
    </div>
  );
};
