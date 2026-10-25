import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedPageProps {
  attemptedPath: string;
  onNavigate: (path: string) => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ attemptedPath, onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-4 font-sans text-center">
      <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-red-950 border border-red-800 text-red-400 mx-auto rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 stroke-[2]" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-red-400 font-bold block">
            403 Forbidden · Ограничение доступа
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Доступ запрещён
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Попытка обращения к закрытому разделу: <span className="font-mono text-zinc-300 bg-black px-1.5 py-0.5">{attemptedPath}</span>.
          </p>
        </div>

        <div className="p-4 bg-black/60 border border-zinc-800 text-xs text-zinc-400 space-y-1.5 text-left font-mono">
          <p><span className="text-zinc-500">Пользователь:</span> {user ? `${user.fullName} (${user.email})` : 'Не авторизован (Аноним)'}</p>
          <p><span className="text-zinc-500">Ваша роль:</span> {user?.roles?.join(', ') || 'GUEST'}</p>
          <p className="text-[11px] text-red-400/90 font-sans pt-1">
            Склад, финансовая аналитика, себестоимость и управление сотрудниками доступны исключительно авторизованному персоналу с соответствующими полномочиями.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => onNavigate('/')}
            className="flex-1 py-3 px-4 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            В магазин
          </button>

          {user && (
            <button
              onClick={() => onNavigate('/account')}
              className="flex-1 py-3 px-4 bg-zinc-800 text-white text-xs uppercase tracking-widest font-semibold hover:bg-zinc-700 transition-colors"
            >
              В кабинет
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
