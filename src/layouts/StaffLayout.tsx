import React from 'react';
import { ClipboardList, Box, Barcode, MessageSquare, LogOut, ArrowLeft, PackageCheck, History, ArrowDownToLine, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StaffLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children, activePath, onNavigate }) => {
  const { user, hasPermission, hasRole, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('/login');
  };

  const isWarehouseOnly = hasRole('WAREHOUSE') && !hasRole('MANAGER') && !hasRole('OWNER');
  const isManagerOnly = hasRole('MANAGER') && !hasRole('WAREHOUSE') && !hasRole('OWNER');

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans">
      {/* Staff Workspace Header */}
      <header className="bg-zinc-950 text-white border-b border-zinc-800">
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
              <span className="text-sm font-semibold tracking-tight text-white">
                {isWarehouseOnly ? 'Рабочее место склада (Warehouse)' : isManagerOnly ? 'Рабочее место менеджера (Sales CRM)' : 'Служебная панель UMAR'}
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-700">
                {user?.roles.join(' · ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-400 hidden sm:inline">{user?.fullName} ({user?.email})</span>
            {hasRole('OWNER') && (
              <button
                onClick={() => onNavigate('/admin')}
                className="px-2.5 py-1 bg-red-950 text-red-200 border border-red-800 text-[11px] font-semibold"
              >
                Панель владельца →
              </button>
            )}
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

      {/* Staff Navigation Tabs */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
            
            {/* WAREHOUSE TABS */}
            {hasPermission('inventory:read') && (
              <button
                onClick={() => onNavigate('/staff/warehouse')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activePath === '/staff/warehouse'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <Box className="w-4 h-4" />
                Складские остатки
              </button>
            )}

            {hasPermission('inventory:receive') && (
              <button
                onClick={() => onNavigate('/staff/warehouse/receive')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activePath === '/staff/warehouse/receive'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <ArrowDownToLine className="w-4 h-4" />
                Приёмка товара
              </button>
            )}

            {hasPermission('orders:fulfill') && (
              <button
                onClick={() => onNavigate('/staff/pickups')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activePath === '/staff/pickups'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                Комплектация заказов
              </button>
            )}

            {hasPermission('inventory:read') && (
              <button
                onClick={() => onNavigate('/staff/sku')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activePath === '/staff/sku'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <Barcode className="w-4 h-4" />
                Сканер SKU
              </button>
            )}

            {hasPermission('inventory:read') && (
              <button
                onClick={() => onNavigate('/staff/warehouse/history')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activePath === '/staff/warehouse/history'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <History className="w-4 h-4" />
                История операций
              </button>
            )}

            {/* MANAGER TABS */}
            {hasPermission('orders:read_all') && (
              <button
                onClick={() => onNavigate('/staff/orders')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activePath === '/staff/orders' || activePath === '/staff'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Заказы магазина
              </button>
            )}

            {hasPermission('conversations:manage') && (
              <button
                onClick={() => onNavigate('/staff/communications')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activePath === '/staff/communications'
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Клиенты & Диалоги
              </button>
            )}
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
