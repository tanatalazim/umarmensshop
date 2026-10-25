import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Shield, Truck, AlertCircle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { ImageWithFallback } from '../../components/ImageWithFallback';

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [deliveryType, setDeliveryType] = useState<'courier_almaty' | 'pickup'>('courier_almaty');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-28 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Ваша корзина пуста</h2>
        <p className="text-xs text-zinc-400">Добавьте хотя бы одно изделие перед переходом к оформлению</p>
        <button
          onClick={() => onNavigate('/catalog')}
          className="mt-6 px-8 py-3.5 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors"
        >
          В каталог
        </button>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Пожалуйста, укажите имя и контактный номер телефона');
      return;
    }

    if (deliveryType === 'courier_almaty' && !street.trim()) {
      setErrorMessage('Пожалуйста, укажите адрес доставки по Алматы');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('Необходимо подтвердить согласие с условиями обслуживания');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: items.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryType,
        deliveryAddress: deliveryType === 'courier_almaty'
          ? `г. Алматы, ${street.trim()}${apartment ? `, кв./оф. ${apartment.trim()}` : ''}`
          : 'Самовывоз: пр. Достык, 128',
        customerComment: customerComment.trim() || undefined,
        paymentMethod: 'kaspi_pay'
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'Authorization': `Bearer ${localStorage.getItem('umar_auth_token')}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'OUT_OF_STOCK') {
          setErrorMessage(`К сожалению, ${data.message}`);
        } else {
          setErrorMessage(data.message || 'Ошибка оформления заказа');
        }
        setIsSubmitting(false);
        return;
      }

      // Order created! Clear cart and redirect to order success
      clearCart();
      const redirectId = data.order?.id || data.orderId;
      const trackingToken = data.order?.tracking_token || data.trackingToken;
      const paymentId = data.payment?.id || data.paymentId;

      onNavigate(`/order-success?orderId=${redirectId}&token=${trackingToken}&paymentId=${paymentId || ''}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Не удалось связаться с сервером. Проверьте интернет-соединение.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-zinc-100">
      {/* Breadcrumb & Title */}
      <div className="mb-10 space-y-2">
        <button
          onClick={() => onNavigate('/catalog')}
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Вернуться к покупкам</span>
        </button>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white pt-2">
          Оформление заказа
        </h1>
        <p className="text-xs text-zinc-400">
          Прямое бронирование изделий из бутика. Оплата через безопасный шлюз Kaspi QR.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-8 p-4 bg-red-950/60 border border-red-900/80 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. Contacts */}
          <div className="p-6 sm:p-8 bg-zinc-950 border border-zinc-900 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white flex items-center justify-between pb-3 border-b border-zinc-900">
              <span>1. Контактные данные получателя</span>
              {user && <span className="text-[10px] text-zinc-500 font-mono font-normal">Клиент: {user.email}</span>}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                  Имя и фамилия *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Алексей Сапаров"
                  className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                  Номер телефона (WhatsApp / Kaspi) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+7 (777) 123-45-67"
                  className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                Email для электронного фискального чека (необязательно)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="client@mail.kz"
                className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
              />
            </div>
          </div>

          {/* 2. Delivery Method */}
          <div className="p-6 sm:p-8 bg-zinc-950 border border-zinc-900 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white pb-3 border-b border-zinc-900">
              2. Способ получения
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setDeliveryType('courier_almaty')}
                className={`p-4 border cursor-pointer flex flex-col justify-between transition-all ${
                  deliveryType === 'courier_almaty'
                    ? 'border-white bg-zinc-900/60 ring-1 ring-white'
                    : 'border-zinc-850 bg-zinc-900/20 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Курьер UMAR (Алматы)</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {subtotal >= 100000 ? 'Бесплатно' : '2 500 ₸'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  Персональная доставка с возможностью примерки смежных размеров. В пределах города.
                </p>
              </label>

              <label
                onClick={() => setDeliveryType('pickup')}
                className={`p-4 border cursor-pointer flex flex-col justify-between transition-all ${
                  deliveryType === 'pickup'
                    ? 'border-white bg-zinc-900/60 ring-1 ring-white'
                    : 'border-zinc-850 bg-zinc-900/20 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Самовывоз из бутика</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">Бесплатно</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  пр. Достык, 128 (ежедневно с 10:00 до 21:00). Подготовка за 30 минут.
                </p>
              </label>
            </div>

            {deliveryType === 'courier_almaty' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                    Улица и номер дома *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="ул. Абая, 52"
                    className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                      Квартира / Офис
                    </label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="кв. 14"
                      className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5">
                      Комментарий курьеру
                    </label>
                    <input
                      type="text"
                      value={customerComment}
                      onChange={(e) => setCustomerComment(e.target.value)}
                      placeholder="Домофон 14K, шлагбаум"
                      className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Payment Method */}
          <div className="p-6 sm:p-8 bg-zinc-950 border border-zinc-900 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white pb-3 border-b border-zinc-900">
              3. Способ оплаты
            </h2>

            <div className="p-4 border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 text-white font-bold flex items-center justify-center text-xs tracking-tighter">
                  Kaspi
                </div>
                <div>
                  <span className="text-xs font-bold text-white block uppercase tracking-wider">Kaspi QR / Kaspi Pay</span>
                  <span className="text-[11px] text-zinc-400">Мгновенная оплата через приложение Kaspi.kz по динамическому QR-коду</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-zinc-800 text-amber-300 border border-amber-900/50">
                Sandbox Mode
              </span>
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 bg-zinc-900 border-zinc-700 text-white focus:ring-0"
              />
              <label htmlFor="terms" className="text-xs text-zinc-400 cursor-pointer">
                Я подтверждаю согласие с условиями публичной оферты и политики обработки персональных данных UMAR MENS SHOP.
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 bg-zinc-950 border border-zinc-900 space-y-6 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-zinc-900 pb-4">
              Ваш заказ ({items.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div className="divide-y divide-zinc-900 max-h-80 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.variantId} className="py-3 flex gap-3 text-xs">
                  <div className="w-14 h-18 shrink-0 bg-zinc-900">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.productName}
                      aspectRatio="aspect-[3/4]"
                      categoryName="UMAR"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{item.productName}</p>
                    <p className="text-zinc-400 text-[11px]">Размер: {item.size} · {item.color}</p>
                    <p className="text-zinc-500 font-mono text-[10px]">Кол-во: {item.quantity} шт.</p>
                  </div>
                  <div className="font-mono font-bold text-white shrink-0">
                    {(item.price * item.quantity).toLocaleString('ru-RU')} ₸
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-900 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Товары:</span>
                <span className="font-mono text-zinc-200">{subtotal.toLocaleString('ru-RU')} ₸</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Доставка ({deliveryType === 'courier_almaty' ? 'Алматы' : 'Самовывоз'}):</span>
                <span className="font-mono text-zinc-200">
                  {deliveryFee === 0 ? 'Бесплатно' : `${deliveryFee.toLocaleString('ru-RU')} ₸`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-zinc-900">
                <span className="font-serif">Итого к оплате:</span>
                <span className="font-mono text-xl text-amber-400">{total.toLocaleString('ru-RU')} ₸</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${
                isSubmitting ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Резервирование и создание...' : 'Оплатить через Kaspi Pay'}</span>
            </button>

            <div className="p-4 bg-zinc-900/40 border border-zinc-900 text-xs text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-[11px] uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Безопасность сделки</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Остатки физически резервируются сервером на складе в Алматы на 15 минут. Если оплата не поступит, резерв освобождается автоматически.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
