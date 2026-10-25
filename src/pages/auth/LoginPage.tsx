import React, { useState } from 'react';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success && res.user) {
      if (res.user.roles.includes('OWNER')) {
        onNavigate('/admin');
      } else if (res.user.roles.includes('MANAGER')) {
        onNavigate('/staff/orders');
      } else if (res.user.roles.includes('WAREHOUSE')) {
        onNavigate('/staff/warehouse');
      } else {
        onNavigate('/account');
      }
    } else {
      setError(res.error || 'Неверный email или пароль');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black uppercase tracking-wider font-semibold mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          В магазин
        </button>

        <img
          src="/assets/aistudio/_____cecc8cff.jpg"
          alt="UMAR"
          className="h-10 w-auto mx-auto bg-black px-2 py-1 rounded"
        />

        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Вход в личный кабинет
        </h2>
        <p className="text-xs text-zinc-500">
          Для покупателей и сотрудников UMAR MENS SHOP
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-zinc-200 shadow-xs sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Электронная почта
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@mail.kz или staff@umarmens.kz"
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 focus:bg-white focus:outline-none focus:border-black font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Проверка сессии...' : 'Войти в систему'}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-100 text-center text-xs">
            <span className="text-zinc-500">Впервые в магазине? </span>
            <button
              onClick={() => onNavigate('/register')}
              className="font-bold text-black hover:underline"
            >
              Зарегистрироваться
            </button>
          </div>

          {/* Test Accounts Segmented Helper */}
          <div className="pt-4 border-t border-zinc-100">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-medium mb-2 text-center">
              Тестовые аккаунты для проверки доступов:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => { setEmail('owner@umarmens.kz'); setPassword('UmarShop2026!Secure'); }}
                className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-left font-mono truncate"
              >
                Владелец (Owner)
              </button>
              <button
                type="button"
                onClick={() => { setEmail('manager@umarmens.kz'); setPassword('UmarShop2026!Secure'); }}
                className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-left font-mono truncate"
              >
                Менеджер (CRM)
              </button>
              <button
                type="button"
                onClick={() => { setEmail('warehouse@umarmens.kz'); setPassword('UmarShop2026!Secure'); }}
                className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-left font-mono truncate"
              >
                Склад (Warehouse)
              </button>
              <button
                type="button"
                onClick={() => { setEmail('customer@gmail.com'); setPassword('UmarShop2026!Secure'); }}
                className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-left font-mono truncate"
              >
                Покупатель
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
