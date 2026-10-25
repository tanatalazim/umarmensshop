import React, { useEffect, useState } from 'react';
import { Package, MapPin, CheckCircle, Clock, Truck, AlertCircle, Heart, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import type { Order } from '../../types';

interface CustomerPortalProps {
  section: 'profile' | 'orders' | 'addresses' | 'favorites';
  orderId?: string;
  onNavigate: (path: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ section, orderId, onNavigate }) => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile edit state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Address add state
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');

  const token = localStorage.getItem('umar_auth_token');

  useEffect(() => {
    if (section === 'orders') {
      setLoading(true);
      fetch('/api/account/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setOrders(data.orders || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (section === 'profile' || section === 'addresses') {
      setLoading(true);
      fetch('/api/account/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setAddresses(data.addresses || []);
          if (data.customer) {
            setFullName(data.customer.full_name);
            setPhone(data.customer.phone);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [section, token]);

  // Single order view
  useEffect(() => {
    if (orderId) {
      setLoading(true);
      fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Заказ не найден или у вас нет доступа к чужому заказу');
          return res.json();
        })
        .then(data => {
          setSelectedOrder(data.order);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [orderId, token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, phone })
      });
      if (res.ok) {
        setProfileSuccess(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim()) return;

    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ street, apartment, isDefault: addresses.length === 0 })
      });
      if (res.ok) {
        setStreet('');
        setApartment('');
        // Refresh
        fetch('/api/account/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(data => setAddresses(data.addresses || []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Section 1: Specific Order Detail
  if (orderId) {
    if (loading) return <div className="p-12 text-center text-xs text-zinc-500">Загрузка данных заказа...</div>;
    if (error || !selectedOrder) {
      return (
        <div className="p-8 bg-zinc-950 border border-red-900/50 text-red-400 text-xs text-center space-y-4">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <p className="font-semibold text-sm">{error || 'Доступ к данному заказу заблокирован'}</p>
          <button
            onClick={() => onNavigate('/account/orders')}
            className="px-5 py-2.5 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-zinc-200 transition-colors"
          >
            К списку моих заказов
          </button>
        </div>
      );
    }

    const orderTotal = selectedOrder.total_amount ?? 0;

    return (
      <div className="bg-zinc-950 border border-zinc-900 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-5 gap-3">
          <div>
            <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Заказ #{selectedOrder.order_number}</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-xl font-bold tracking-tight text-white font-serif">
                Детали заказа
              </h2>
              <span className={`px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-xs font-semibold ${
                selectedOrder.status === 'paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                selectedOrder.status === 'completed' ? 'bg-zinc-900 text-zinc-300 border border-zinc-700' :
                'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {selectedOrder.status}
              </span>
            </div>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {new Date(selectedOrder.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Позиции заказа</h3>
          <div className="divide-y divide-zinc-900 border border-zinc-900 bg-zinc-900/20">
            {selectedOrder.items?.map(it => (
              <div key={it.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block text-sm">{it.product_name}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">Артикул: {it.sku} · Размер: {it.size} · {it.quantity} шт.</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  {(it.total_price ?? 0).toLocaleString('ru-RU')} ₸
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800 text-xs flex justify-between items-center font-bold">
          <span className="text-zinc-400 uppercase tracking-wider text-[11px]">Итоговая сумма:</span>
          <span className="font-mono text-lg text-white font-bold">{orderTotal.toLocaleString('ru-RU')} ₸</span>
        </div>
      </div>
    );
  }

  // Section 2: Orders List
  if (section === 'orders') {
    return (
      <div className="bg-zinc-950 border border-zinc-900 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white font-serif">История моих заказов</h2>
          <p className="text-xs text-zinc-400 mt-1">Здесь отображаются только заказы, оформленные под вашим аккаунтом</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500">Загрузка заказов...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 space-y-3">
            <Package className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-300">У вас пока нет заказов</p>
            <p className="text-xs text-zinc-500">Оформите заказ в каталоге, и он появится здесь</p>
            <button
              onClick={() => onNavigate('/catalog')}
              className="mt-4 px-6 py-2.5 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-zinc-200 transition-colors"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900 border border-zinc-900">
            {orders.map(order => (
              <div key={order.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-white">#{order.order_number}</span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs ${
                      order.status === 'paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                      order.status === 'completed' ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' :
                      'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')} · {order.delivery_type === 'courier_almaty' ? 'Доставка по Алматы' : 'Самовывоз'}
                  </p>
                  <p className="text-sm font-mono font-bold text-white pt-1">
                    {(order.total_amount ?? 0).toLocaleString('ru-RU')} ₸
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate(`/track-order?token=${order.tracking_token}`)}
                    className="px-3 py-1.5 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs font-medium transition-colors"
                  >
                    Отследить
                  </button>
                  <button
                    onClick={() => onNavigate(`/account/orders/${order.id}`)}
                    className="px-3.5 py-1.5 bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors uppercase tracking-wider"
                  >
                    Детали
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Section 3: Profile Form
  if (section === 'profile') {
    return (
      <div className="bg-zinc-950 border border-zinc-900 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white font-serif">Персональные данные</h2>
          <p className="text-xs text-zinc-400 mt-1">Имя и номер телефона для быстрой доставки курьером</p>
        </div>

        {profileSuccess && (
          <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs">
            Данные профиля успешно сохранены
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email (логин)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Имя и фамилия</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Контактный телефон</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs p-3 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors"
          >
            Сохранить изменения
          </button>
        </form>
      </div>
    );
  }

  // Section 4: Favorites
  if (section === 'favorites') {
    return (
      <div className="bg-zinc-950 border border-zinc-900 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white font-serif">Избранные изделия</h2>
          <p className="text-xs text-zinc-400 mt-1">
            {favorites.length} {favorites.length === 1 ? 'изделие' : 'изделий'} сохранено в вашем гардеробе
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 space-y-3">
            <Heart className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-zinc-300">В избранном пока ничего нет</p>
            <p className="text-xs text-zinc-500">Отмечайте понравившиеся костюмы и рубашки сердечком в каталоге</p>
            <button
              onClick={() => onNavigate('/catalog')}
              className="mt-4 px-6 py-2.5 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-zinc-200 transition-colors"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {favorites.map(p => (
              <div key={p.id} className="border border-zinc-900 bg-zinc-950 p-3 space-y-3 flex flex-col justify-between group">
                <div
                  onClick={() => onNavigate(`/product/${p.slug}`)}
                  className="cursor-pointer space-y-2"
                >
                  <ImageWithFallback
                    src={p.primary_image}
                    alt={p.name}
                    aspectRatio="aspect-[3/4]"
                    categoryName={p.category_name}
                  />
                  <div className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">
                    {p.category_name}
                  </div>
                  <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">{p.name}</h3>
                  <div className="font-mono text-xs font-bold text-white">
                    {(p.base_price ?? 0).toLocaleString('ru-RU')} ₸
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
                  <button
                    onClick={() => toggleFavorite(p)}
                    className="text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                  <button
                    onClick={() => onNavigate(`/product/${p.slug}`)}
                    className="font-bold text-white hover:text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[11px]"
                  >
                    <span>Купить</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Section 5: Addresses
  return (
    <div className="bg-zinc-950 border border-zinc-900 p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white font-serif">Адреса доставки в Алматы</h2>
        <p className="text-xs text-zinc-400 mt-1">Сохранённые адреса для быстрого чекаута</p>
      </div>

      <div className="space-y-3">
        {addresses.map(addr => (
          <div key={addr.id} className="p-4 border border-zinc-900 bg-zinc-900/30 flex justify-between items-center text-xs">
            <div>
              <p className="font-semibold text-white">{addr.city}, {addr.street}</p>
              {addr.apartment && <p className="text-zinc-400">Квартира/офис: {addr.apartment}</p>}
            </div>
            {addr.is_default === 1 && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-800 text-zinc-200 border border-zinc-700">
                Основной
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-zinc-900">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">Добавить новый адрес</h3>
        <form onSubmit={handleAddAddress} className="space-y-3 max-w-md text-xs">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Улица и дом *</label>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="ул. Сатпаева, 30"
              className="w-full p-3 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Квартира / Офис</label>
            <input
              type="text"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              placeholder="кв. 54"
              className="w-full p-3 bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-white text-black uppercase tracking-wider font-bold hover:bg-zinc-200 transition-colors"
          >
            Добавить адрес
          </button>
        </form>
      </div>
    </div>
  );
};
