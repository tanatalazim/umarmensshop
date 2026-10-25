import React, { useEffect, useState } from 'react';
import { CheckCircle2, QrCode, ArrowRight, ShieldCheck, Copy, Check, Clock } from 'lucide-react';
import type { Order } from '../../types';

interface OrderSuccessPageProps {
  orderId: string;
  trackingToken: string;
  paymentId?: string;
  onNavigate: (path: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  orderId,
  trackingToken,
  paymentId,
  onNavigate
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchOrder = () => {
    fetch(`/api/orders/track?token=${trackingToken}`)
      .then(res => res.json())
      .then(data => {
        if (data.order) {
          setOrder(data.order);
          if (data.order.status === 'paid' || data.order.status === 'packed' || data.order.status === 'shipped') {
            setPaymentSuccess(true);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [trackingToken]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/track-order?token=${trackingToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateKaspiPayment = async () => {
    setIsSimulatingPayment(true);
    try {
      const res = await fetch('/api/payments/kaspi/simulate-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentId || orderId
        })
      });

      if (res.ok) {
        setPaymentSuccess(true);
        fetchOrder();
      }
    } catch (err) {
      console.error('Failed to simulate payment:', err);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const displayOrderNumber = (order as any)?.orderNumber || (order as any)?.order_number || 'UM-NEW';
  const displayTotal = (order as any)?.totalAmount ?? (order as any)?.total_amount ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 text-zinc-100">
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-white text-black mx-auto flex items-center justify-center rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-black stroke-[2.5]" />
        </div>
        <div className="text-[11px] uppercase tracking-widest text-amber-400 font-semibold">
          Заказ сформирован · Резерв активирован
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white">
          Заказ #{displayOrderNumber}
        </h1>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Изделия зарезервированы на складе в Алматы. Для завершения оформления подтвердите платёж через Kaspi QR.
        </p>
      </div>

      {/* Kaspi Pay Interactive Sandbox Module */}
      <div className="p-8 bg-zinc-950 border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 text-white font-bold flex items-center justify-center text-xs tracking-tighter">
              Kaspi
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Оплата через Kaspi QR</h3>
              <p className="text-xs text-zinc-400">Официальный шлюз (Sandbox)</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">К оплате:</span>
            <span className="text-xl font-mono font-bold text-amber-400">
              {order ? `${(displayTotal || 0).toLocaleString('ru-RU')} ₸` : 'Загрузка...'}
            </span>
          </div>
        </div>

        {paymentSuccess ? (
          <div className="p-6 bg-emerald-950/40 border border-emerald-800 text-center space-y-2">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-600 text-white rounded-full">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-sm font-bold text-emerald-300">Платёж успешно подтверждён на сервере!</h4>
            <p className="text-xs text-emerald-400/90">
              Статус заказа: <span className="font-mono font-semibold uppercase">Оплачен (paid)</span>. 
              Склад UMAR приступил к комплектации и упаковке.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center py-4">
            {/* Visual QR Code Representation */}
            <div className="w-52 h-52 bg-white p-3 flex flex-col items-center justify-center text-center shadow-lg">
              <QrCode className="w-32 h-32 text-zinc-950" />
              <span className="text-[10px] font-mono font-bold text-zinc-900 mt-2 uppercase tracking-wider">
                Сканируйте в Kaspi.kz
              </span>
            </div>

            <div className="space-y-4 max-w-xs text-center sm:text-left">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-white uppercase tracking-wider block">Инструкция по оплате:</span>
                <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Откройте приложение Kaspi.kz</li>
                  <li>Нажмите Kaspi QR</li>
                  <li>Отсканируйте код на экране</li>
                </ol>
              </div>

              {/* Dev/Sandbox simulation button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSimulatingPayment}
                  onClick={handleSimulateKaspiPayment}
                  className="w-full py-3 px-4 bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors"
                >
                  {isSimulatingPayment ? 'Проверка транзакции...' : 'Имитировать оплату в Kaspi.kz'}
                </button>
                <span className="block text-[10px] text-zinc-500 text-center mt-1.5 font-mono">
                  (Эмулирует вызов webhook Kaspi с валидацией)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secret Tracking Token Box */}
      <div className="p-6 bg-zinc-950 border border-zinc-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Безопасная ссылка для отслеживания</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано!' : 'Скопировать'}</span>
          </button>
        </div>

        <div className="p-3 bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 break-all select-all">
          {window.location.origin}/track-order?token={trackingToken}
        </div>
        <p className="text-[11px] text-zinc-500">
          Сохраните этот токен или перейдите по ссылке в любое время, чтобы проверить статус сбора и отправки без ввода логина и пароля.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={() => onNavigate(`/track-order?token=${trackingToken}`)}
          className="w-full sm:w-auto px-6 py-3.5 border border-zinc-800 text-zinc-300 text-xs uppercase tracking-wider font-semibold hover:border-white hover:text-white transition-colors"
        >
          Страница отслеживания
        </button>

        <button
          onClick={() => onNavigate('/catalog')}
          className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-zinc-200 flex items-center justify-center gap-2 transition-colors"
        >
          <span>Вернуться в каталог</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
