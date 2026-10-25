import React, { useState } from 'react';
import { UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register({ email, password, fullName, phone });
    setLoading(false);

    if (res.success) {
      onNavigate('/account');
    } else {
      setError(res.error || 'Ошибка при регистрации');
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
          Регистрация покупателя
        </h2>
        <p className="text-xs text-zinc-500">
          Создание личного кабинета для отслеживания заказов и скидок
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
                ФИО *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Рустам Байзаков"
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Телефон *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (701) 234-56-78"
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 focus:bg-white focus:outline-none focus:border-black font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Электронная почта *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@mail.kz"
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Пароль *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-300 focus:bg-white focus:outline-none focus:border-black font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Создание профиля...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-100 text-center text-xs">
            <span className="text-zinc-500">Уже есть аккаунт? </span>
            <button
              onClick={() => onNavigate('/login')}
              className="font-bold text-black hover:underline"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
