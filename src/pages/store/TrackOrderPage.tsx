import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle2, Clock, Truck, Shield } from 'lucide-react';

interface TrackOrderPageProps {
  initialToken?: string;
  onNavigate: (path: string) => void;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialToken, onNavigate }) => {
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [orderData, setOrderData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = (tokenToFetch: string) => {
    if (!tokenToFetch.trim()) return;
    setLoading(true);
    setError(null);

    fetch(`/api/orders/track/${encodeURIComponent(tokenToFetch.trim())}`)
      .then(res => {
        if (!res.ok) throw new Error('Заказ с указанным токеном отслеживания не найден');
        return res.json();
      })
      .then(data => {
        setOrderData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setOrderData(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialToken) {
      fetchTracking(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(tokenInput);
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'new':
      case 'awaiting_payment':
        return 1;
      case 'paid':
        return 2;
      case 'processing':
        return 3;
      case 'ready_for_pickup':
      case 'shipped':
        return 4;
      case 'completed':
        return 5;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const step = orderData ? getStatusStep(orderData.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          Отслеживание заказа
        </h1>
        <p className="text-xs text-zinc-500">
          Введите ваш персональный токен отслеживания (выдан при оформлении заказа или отправлен по SMS/WhatsApp).
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Вставьте токен: например, tok_48a91c..."
            className="w-full text-xs font-mono p-3 bg-zinc-50 border border-zinc-300 focus:bg-white focus:outline-none focus:border-black"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-black text-white text-xs uppercase tracking-wider font-bold hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Поиск...' : 'Проверить'}
        </button>
      </form>

      {error && (
        <div className="max-w-xl mx-auto p-4 bg-red-50 border border-red-200 text-red-700 text-xs text-center">
          {error}
        </div>
      )}

      {/* Order Status Display */}
      {orderData && (
        <div className="bg-white border border-zinc-200 p-8 space-y-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
            <div>
              <span className="text-xs text-zinc-400 font-mono block">Номер заказа:</span>
              <h2 className="text-2xl font-bold font-mono text-zinc-900">{orderData.orderNumber}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400 block">Дата оформления:</span>
              <span className="text-xs font-mono font-medium text-zinc-800">
                {new Date(orderData.createdAt).toLocaleString('ru-RU')}
              </span>
            </div>
          </div>

          {/* Stepper */}
          {step > 0 ? (
            <div className="py-4">
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className={`space-y-2 ${step >= 1 ? 'text-black font-semibold' : 'text-zinc-400'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-mono ${
                    step >= 1 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    1
                  </div>
                  <span>Оформлен</span>
                </div>

                <div className={`space-y-2 ${step >= 2 ? 'text-black font-semibold' : 'text-zinc-400'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-mono ${
                    step >= 2 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    2
                  </div>
                  <span>Оплачен</span>
                </div>

                <div className={`space-y-2 ${step >= 3 ? 'text-black font-semibold' : 'text-zinc-400'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-mono ${
                    step >= 3 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    3
                  </div>
                  <span>Комплектация</span>
                </div>

                <div className={`space-y-2 ${step >= 4 ? 'text-black font-semibold' : 'text-zinc-400'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-mono ${
                    step >= 4 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    4
                  </div>
                  <span>В пути / Готов</span>
                </div>

                <div className={`space-y-2 ${step >= 5 ? 'text-black font-semibold' : 'text-zinc-400'}`}>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-mono ${
                    step >= 5 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    5
                  </div>
                  <span>Выдан</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 text-red-700 text-xs text-center font-semibold">
              Заказ отменён
            </div>
          )}

          {/* Itemized Order Content */}
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Содержимое заказа
            </h3>
            <div className="divide-y divide-zinc-100">
              {orderData.items?.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-zinc-900 block">{item.product_name}</span>
                    <span className="text-zinc-500">Размер: {item.size} · Цвет: {item.color} · {item.quantity} шт.</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900">
                    {item.total_price.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-zinc-100 text-sm font-bold text-zinc-900">
              <span>Итоговая сумма:</span>
              <span className="font-mono text-base">
                {((orderData as any)?.totalAmount ?? (orderData as any)?.total_amount ?? 0).toLocaleString('ru-RU')} ₸
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
