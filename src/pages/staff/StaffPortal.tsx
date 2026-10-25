import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Box,
  Barcode,
  MessageSquare,
  Check,
  Search,
  AlertCircle,
  PackageCheck,
  History,
  ArrowDownToLine,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StaffPortalProps {
  section: 'orders' | 'warehouse' | 'receive' | 'pickups' | 'sku' | 'history' | 'communications';
  onNavigate: (path: string) => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({ section, onNavigate }) => {
  const { user, hasPermission } = useAuth();
  const token = localStorage.getItem('umar_auth_token');

  // Shared state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Orders State (Manager & Owner)
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Warehouse Inventory State (Warehouse & Owner)
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');

  // Stock Receive State
  const [receiveVariantId, setReceiveVariantId] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState<number>(5);
  const [receiveDocNumber, setReceiveDocNumber] = useState('');
  const [receiveReason, setReceiveReason] = useState('Плановое поступление с фабрики');
  const [receiveState, setReceiveState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [receiveMessage, setReceiveMessage] = useState<string | null>(null);

  // Pickups / Assembly State
  const [pickups, setPickups] = useState<any[]>([]);

  // SKU Scanner State
  const [skuQuery, setSkuQuery] = useState('');
  const [skuResult, setSkuResult] = useState<any | null>(null);
  const [skuError, setSkuError] = useState<string | null>(null);

  // Operations History
  const [movements, setMovements] = useState<any[]>([]);

  // Communications CRM State
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Loaders
  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/staff/orders', {
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
  };

  const fetchInventory = () => {
    setLoading(true);
    fetch('/api/staff/inventory', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setInventory(data.inventory || []);
        if (data.inventory?.length > 0 && !receiveVariantId) {
          setReceiveVariantId(data.inventory[0].variant_id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchPickups = () => {
    setLoading(true);
    fetch('/api/staff/pickups', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPickups(data.pickups || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchMovements = () => {
    setLoading(true);
    fetch('/api/staff/inventory/movements', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMovements(data.movements || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchConversations = () => {
    setLoading(true);
    fetch('/api/staff/conversations', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setConversations(data.conversations || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setError(null);
    if (section === 'orders') fetchOrders();
    else if (section === 'warehouse' || section === 'receive') fetchInventory();
    else if (section === 'pickups') fetchPickups();
    else if (section === 'history') fetchMovements();
    else if (section === 'communications') fetchConversations();
    else setLoading(false);
  }, [section, token]);

  // Handle status update (Manager)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle SKU lookup
  const handleSkuSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuQuery.trim()) return;

    setSkuError(null);
    setSkuResult(null);

    try {
      const res = await fetch(`/api/staff/inventory/sku/${encodeURIComponent(skuQuery.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setSkuError(data.message || 'Артикул не найден');
      } else {
        setSkuResult(data.item);
      }
    } catch {
      setSkuError('Ошибка связи с базой склада');
    }
  };

  // Handle Stock Receive (Warehouse) with Idempotency Token
  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveVariantId || receiveQuantity <= 0) return;

    setReceiveState('submitting');
    setReceiveMessage(null);

    // Generate unique idempotency key for this submission attempt
    const idempotencyKey = `rcv_${receiveVariantId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await fetch('/api/staff/inventory/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          variantId: receiveVariantId,
          quantity: Number(receiveQuantity),
          documentNumber: receiveDocNumber.trim(),
          reason: receiveReason.trim(),
          idempotencyKey
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setReceiveState('error');
        setReceiveMessage(data.message || 'Ошибка проведения приёмки');
      } else {
        setReceiveState('success');
        setReceiveMessage(data.message || `Успешно принято +${receiveQuantity} шт. Новый остаток: ${data.newQuantity} шт.`);
        fetchInventory();
      }
    } catch (err: any) {
      setReceiveState('error');
      setReceiveMessage(err.message || 'Ошибка сетевого соединения');
    }
  };

  // Handle Mark Packed (Warehouse)
  const handlePackOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/staff/pickups/${orderId}/pack`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPickups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = !statusFilter || o.status === statusFilter;
    const matchesSearch = !searchFilter || 
      o.order_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.customer_phone.includes(searchFilter);
    return matchesStatus && matchesSearch;
  });

  // Filtered inventory
  const filteredInventory = inventory.filter(i => {
    if (!inventorySearch) return true;
    const q = inventorySearch.toLowerCase();
    return i.sku.toLowerCase().includes(q) || i.product_name.toLowerCase().includes(q) || i.size.toLowerCase().includes(q);
  });

  // =========================================================================
  // VIEW 1: WAREHOUSE INVENTORY LIST
  // =========================================================================
  if (section === 'warehouse') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Складские остатки UMAR MENS
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Актуальные остатки, активные резервы и свободное количество в Алматы
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/staff/warehouse/receive')}
              className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Приёмка товара
            </button>
            <button
              onClick={fetchInventory}
              className="p-2 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600"
              title="Обновить"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 border border-zinc-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="Поиск по артикулу SKU, названию изделия или размеру..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:border-black font-medium"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white border border-zinc-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-white font-mono uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3">Артикул SKU</th>
                <th className="p-3">Изделие</th>
                <th className="p-3">Размер / Цвет</th>
                <th className="p-3 text-right">Физич. остаток</th>
                <th className="p-3 text-right">В резерве</th>
                <th className="p-3 text-right">Доступно для продажи</th>
                <th className="p-3 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">Загрузка данных склада...</td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">Позиции не найдены</td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  const isLow = item.available_quantity <= item.min_threshold;
                  const isOut = item.available_quantity <= 0;

                  return (
                    <tr key={item.variant_id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-zinc-900">{item.sku}</td>
                      <td className="p-3">
                        <span className="font-semibold text-zinc-900 block">{item.product_name}</span>
                        <span className="text-[10px] text-zinc-400 uppercase">{item.category_name}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono bg-zinc-100 px-1.5 py-0.5 text-zinc-800 font-medium">{item.size}</span>
                        <span className="text-zinc-500 ml-2">{item.color}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-900">{item.quantity} шт.</td>
                      <td className="p-3 text-right font-mono text-zinc-500">{item.reserved_quantity} шт.</td>
                      <td className="p-3 text-right font-mono font-bold text-sm">
                        <span className={isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}>
                          {item.available_quantity} шт.
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold text-[10px] uppercase">
                            Распродано
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                            Мало
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                            Норма
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: RECEIVE STOCK (ПРИЁМКА ТОВАРА)
  // =========================================================================
  if (section === 'receive') {
    const selectedVariant = inventory.find(i => i.variant_id === receiveVariantId);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Официальная приёмка товара на склад
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Операция фиксируется в журнале движений и атомарно увеличивает остаток в базе
          </p>
        </div>

        {receiveMessage && (
          <div className={`p-4 border text-xs flex items-center gap-2 ${
            receiveState === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {receiveState === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{receiveMessage}</span>
          </div>
        )}

        <form onSubmit={handleReceiveStock} className="bg-white border border-zinc-200 p-6 space-y-5 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Выберите товар и артикул SKU *
            </label>
            <select
              value={receiveVariantId}
              onChange={(e) => setReceiveVariantId(e.target.value)}
              required
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 text-xs focus:bg-white focus:outline-none focus:border-black font-medium"
            >
              {inventory.map(i => (
                <option key={i.variant_id} value={i.variant_id}>
                  {i.sku} — {i.product_name} ({i.size}, {i.color}) [Текущий остаток: {i.quantity} шт.]
                </option>
              ))}
            </select>
          </div>

          {selectedVariant && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 text-xs grid grid-cols-3 gap-2">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">Текущий склад:</span>
                <span className="font-mono font-bold text-zinc-900">{selectedVariant.quantity} шт.</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">В резервах:</span>
                <span className="font-mono font-medium text-zinc-600">{selectedVariant.reserved_quantity} шт.</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">Свободно:</span>
                <span className="font-mono font-bold text-emerald-700">{selectedVariant.available_quantity} шт.</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Количество к оприходованию *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Номер накладной / акта
              </label>
              <input
                type="text"
                placeholder="ТТН № 2026-048"
                value={receiveDocNumber}
                onChange={(e) => setReceiveDocNumber(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-300 text-xs focus:bg-white focus:outline-none focus:border-black font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Основание приёмки / примечание
            </label>
            <input
              type="text"
              value={receiveReason}
              onChange={(e) => setReceiveReason(e.target.value)}
              placeholder="Поставка с итальянской фабрики Biella"
              className="w-full p-2.5 bg-zinc-50 border border-zinc-300 text-xs focus:bg-white focus:outline-none focus:border-black"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-700" />
              Защита от повторного начисления активна
            </span>

            <button
              type="submit"
              disabled={receiveState === 'submitting'}
              className={`px-6 py-3 text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 ${
                receiveState === 'submitting'
                  ? 'bg-zinc-600 text-zinc-300 cursor-wait'
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}
            >
              <ArrowDownToLine className="w-4 h-4" />
              {receiveState === 'submitting' ? 'Проведение приёмки...' : 'Подтвердить приёмку'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: PICKUPS & ASSEMBLY (КОМПЛЕКТАЦИЯ ЗАКАЗОВ)
  // =========================================================================
  if (section === 'pickups') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Терминал комплектации и пикапов
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Заказы, оплаченные покупателями и ожидающие комплектации кладовщиком
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Загрузка заказов для сборки...</div>
        ) : pickups.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 p-12 text-center text-zinc-500">
            <PackageCheck className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-semibold text-zinc-800">Все заказы укомплектованы</p>
            <p className="text-xs text-zinc-400 mt-1">Новые оплаченные заказы появятся здесь автоматически</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickups.map(order => (
              <div key={order.id} className="bg-white border border-zinc-200 p-5 space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div>
                      <span className="font-mono font-bold text-sm text-zinc-900">#{order.order_number}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-zinc-100 text-zinc-800 ml-2">
                        {order.status}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-700 space-y-1">
                    <p><strong className="text-zinc-900">Получатель:</strong> {order.customer_name} ({order.customer_phone})</p>
                    <p><strong className="text-zinc-900">Доставка:</strong> {order.delivery_address}</p>
                  </div>

                  {/* Items to pick */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Позиции к сборке:
                    </span>
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="p-2 bg-zinc-50 border border-zinc-200 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-zinc-900 block">{it.product_name}</span>
                          <span className="text-zinc-500 font-mono text-[11px]">SKU: {it.sku} · Разм: {it.size}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-black">{it.quantity} шт.</span>
                          <span className="block text-[10px] text-zinc-400 font-mono">Склад: {it.warehouse_stock} шт.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{order.delivery_type === 'courier_almaty' ? 'Курьерская доставка' : 'Самовывоз'}</span>
                  <button
                    onClick={() => handlePackOrder(order.id)}
                    className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wider font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Собрано & Упаковано
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: SKU SCANNER
  // =========================================================================
  if (section === 'sku') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Сканирование и сверка артикулов SKU
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Проверка наличия, размера и остатка по штрихкоду изделия
          </p>
        </div>

        <form onSubmit={handleSkuSearch} className="bg-white border border-zinc-200 p-5 space-y-3">
          <label className="block text-xs font-semibold text-zinc-700">
            Введите артикул (например, UMAR-ST-CH-50 или UMAR-CT-BK-48):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skuQuery}
              onChange={(e) => setSkuQuery(e.target.value)}
              placeholder="UMAR-..."
              className="flex-1 p-2.5 bg-zinc-50 border border-zinc-300 font-mono text-xs focus:bg-white focus:outline-none focus:border-black uppercase"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-zinc-800 flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Проверить
            </button>
          </div>
        </form>

        {skuError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{skuError}</span>
          </div>
        )}

        {skuResult && (
          <div className="bg-white border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="font-mono text-xs text-zinc-400">Артикул проверен</span>
                <h3 className="text-base font-bold text-zinc-900">{skuResult.product_name}</h3>
              </div>
              <span className="font-mono font-bold text-xs bg-zinc-100 px-2 py-1">
                {skuResult.sku}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">Размер:</span>
                <span className="font-mono font-bold text-sm text-zinc-900">{skuResult.size}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Цвет:</span>
                <span className="font-semibold text-zinc-900">{skuResult.color}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Физический остаток:</span>
                <span className="font-mono font-bold text-sm text-zinc-900">{skuResult.quantity} шт.</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Доступно к продаже:</span>
                <span className="font-mono font-bold text-sm text-emerald-700">{skuResult.available_quantity} шт.</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 border-t border-zinc-100 font-mono">
              Локация: {skuResult.warehouse_name || 'Основной склад (Алматы)'}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 5: INVENTORY MOVEMENTS HISTORY (ИСТОРИЯ ОПЕРАЦИЙ)
  // =========================================================================
  if (section === 'history') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            История складских операций
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Журнал оприходований, списаний, резервирований и возвратов
          </p>
        </div>

        <div className="bg-white border border-zinc-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-white font-mono uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3">Дата / Время</th>
                <th className="p-3">Тип операции</th>
                <th className="p-3">Артикул / Изделие</th>
                <th className="p-3 text-right">Изменение</th>
                <th className="p-3">Основание</th>
                <th className="p-3">Сотрудник</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">Загрузка журнала операций...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">Записей пока нет</td>
                </tr>
              ) : (
                movements.map(m => {
                  const isPositive = m.change_amount > 0;
                  return (
                    <tr key={m.id} className="hover:bg-zinc-50">
                      <td className="p-3 font-mono text-zinc-500 text-[11px]">
                        {new Date(m.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                          m.movement_type === 'receipt' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {m.movement_type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-zinc-900 block">{m.product_name}</span>
                        <span className="font-mono text-zinc-400 text-[11px]">SKU: {m.sku} ({m.size})</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sm">
                        <span className={isPositive ? 'text-emerald-700' : 'text-red-600'}>
                          {isPositive ? `+${m.change_amount}` : m.change_amount} шт.
                        </span>
                      </td>
                      <td className="p-3 text-zinc-600 max-w-xs truncate">{m.reason}</td>
                      <td className="p-3 text-zinc-500">{m.performed_by || 'Система'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 6: MANAGER ORDERS LIST (ЗАКАЗЫ МАГАЗИНА)
  // =========================================================================
  if (section === 'orders') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Управление заказами магазина
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Обработка заказов, клиентские контакты и смена статусов выполнения
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 self-start"
            title="Обновить"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="bg-white p-4 border border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Поиск по номеру заказа, имени или телефону..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:border-black font-medium"
            >
              <option value="">Все статусы заказов</option>
              <option value="new">Новые (new)</option>
              <option value="paid">Оплаченные (paid)</option>
              <option value="processing">В комплектации (processing)</option>
              <option value="ready_for_pickup">Готовы к выдаче/курьеру</option>
              <option value="shipped">В пути / Доставляются</option>
              <option value="completed">Завершённые (completed)</option>
              <option value="cancelled">Отменённые (cancelled)</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Загрузка заказов...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 p-12 text-center text-zinc-500">
            <ClipboardList className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-semibold text-zinc-800">Заказы не найдены</p>
            <p className="text-xs text-zinc-400 mt-1">Измените параметры поиска или фильтрации</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white border border-zinc-200 p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-zinc-900">#{order.order_number}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'ready_for_pickup' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'completed' ? 'bg-zinc-100 text-zinc-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {new Date(order.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  {/* Status change dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Сменить статус:</span>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      className="text-xs border border-zinc-300 py-1 px-2.5 bg-white font-medium focus:outline-none focus:border-black"
                    >
                      <option value="new">new</option>
                      <option value="paid">paid</option>
                      <option value="processing">processing</option>
                      <option value="ready_for_pickup">ready_for_pickup</option>
                      <option value="shipped">shipped</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Клиент и контакты</span>
                    <p className="font-semibold text-zinc-900 mt-0.5">{order.customer_name}</p>
                    <p className="font-mono text-zinc-600">{order.customer_phone}</p>
                    <p className="text-zinc-500 mt-1">{order.delivery_address}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Оплата и сумма</span>
                    <p className="font-mono font-bold text-sm text-zinc-900 mt-0.5">{order.total_amount?.toLocaleString('ru-RU')} ₸</p>
                    <p className="text-zinc-500 font-mono text-[11px]">Метод: {order.payment_method} · Статус: {order.payment_status}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-zinc-100 border-t border-zinc-100 pt-2 text-xs">
                  {order.items?.map((it: any, idx: number) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <span className="text-zinc-800">{it.product_name} (SKU: {it.sku}, разм: {it.size}, {it.color})</span>
                      <span className="font-mono font-medium">{it.quantity} шт. × {it.unit_price?.toLocaleString('ru-RU')} ₸</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 7: COMMUNICATIONS CRM (ДИАЛОГИ)
  // =========================================================================
  return (
    <div className="bg-white border border-zinc-200 p-6 space-y-4">
      <h1 className="text-xl font-bold tracking-tight text-zinc-900">
        Клиентские диалоги CRM
      </h1>
      <p className="text-xs text-zinc-500">
        Раздельные публичные ответы клиентам в WhatsApp/Telegram и внутренние заметки менеджеров
      </p>

      {conversations.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200">
          Активных обращений пока нет.
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => (
            <div key={c.id} className="p-3 border border-zinc-200 flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-zinc-900 block">{c.customer_name || 'Клиент'}</span>
                <span className="text-zinc-500">{c.last_message_body || 'Диалог открыт'}</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                {new Date(c.updated_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
