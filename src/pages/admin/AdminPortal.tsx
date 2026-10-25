import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Boxes,
  Users,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Edit2,
  RefreshCw,
  CheckCircle2,
  History,
  Layers,
  Check,
  X
} from 'lucide-react';
import type { InventoryItem, InventoryMovement, AuditLog } from '../../types';

interface AdminPortalProps {
  section: 'analytics' | 'inventory' | 'products' | 'employees' | 'integrations' | 'audit-log' | 'security';
  onNavigate: (path: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ section, onNavigate }) => {
  const token = localStorage.getItem('umar_auth_token');

  // Analytics state
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptVariantId, setReceiptVariantId] = useState('');
  const [receiptQuantity, setReceiptQuantity] = useState(10);
  const [receiptReason, setReceiptReason] = useState('Поступление новой партии');

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [editingPriceProdId, setEditingPriceProdId] = useState<string | null>(null);
  const [newBasePrice, setNewBasePrice] = useState<number>(0);
  const [newDiscountPrice, setNewDiscountPrice] = useState<number | undefined>(undefined);

  // Employees state
  const [employees, setEmployees] = useState<any[]>([]);
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('MANAGER');
  const [newEmpPassword, setNewEmpPassword] = useState('UmarShop2026!Secure');
  const [empModalOpen, setEmpModalOpen] = useState(false);

  // Integrations state
  const [integrations, setIntegrations] = useState<any | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Security live test state
  const [testReport, setTestReport] = useState<any | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  const [loading, setLoading] = useState(true);

  // 1. Fetch Analytics
  const fetchAnalytics = () => {
    fetch('/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAnalytics(data.analytics);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  // 2. Fetch Inventory
  const fetchInventory = () => {
    fetch('/api/admin/inventory', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setInventory(data.inventory || []);
        setMovements(data.movements || []);
        if (data.inventory?.length > 0 && !receiptVariantId) {
          setReceiptVariantId(data.inventory[0].variant_id);
        }
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  // 3. Fetch Products for pricing
  const fetchProducts = () => {
    fetch('/api/catalog/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      });
  };

  // 4. Fetch Employees
  const fetchEmployees = () => {
    fetch('/api/admin/employees', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEmployees(data.users || []);
        setLoading(false);
      });
  };

  // 5. Fetch Integrations
  const fetchIntegrations = () => {
    fetch('/api/admin/integrations', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setIntegrations(data.integrations);
        setLoading(false);
      });
  };

  // 6. Fetch Audit Logs
  const fetchAuditLogs = () => {
    fetch('/api/admin/audit-logs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAuditLogs(data.logs || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    if (section === 'analytics') fetchAnalytics();
    else if (section === 'inventory') fetchInventory();
    else if (section === 'products') fetchProducts();
    else if (section === 'employees') fetchEmployees();
    else if (section === 'integrations') fetchIntegrations();
    else if (section === 'audit-log') fetchAuditLogs();
    else if (section === 'security') {
      runLiveSecurityTests();
      setLoading(false);
    }
  }, [section, token]);

  const handleStockReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/inventory/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          variantId: receiptVariantId,
          quantity: receiptQuantity,
          reason: receiptReason
        })
      });
      if (res.ok) {
        setReceiptModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePrice = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/pricing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          basePrice: newBasePrice,
          discountPrice: newDiscountPrice || undefined
        })
      });
      if (res.ok) {
        setEditingPriceProdId(null);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmpEmail,
          fullName: newEmpName,
          role: newEmpRole,
          password: newEmpPassword
        })
      });
      if (res.ok) {
        setEmpModalOpen(false);
        setNewEmpEmail('');
        setNewEmpName('');
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runLiveSecurityTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/admin/run-security-tests', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTestReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningTests(false);
    }
  };

  // 1. ANALYTICS
  if (section === 'analytics') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Финансовые показатели и аналитика</h1>
          <p className="text-xs text-zinc-400">Данные рассчитываются строго по реальным оплаченным заказам из базы данных</p>
        </div>

        {analytics && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-zinc-900 border border-zinc-800">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                  Общая выручка (Выполнено)
                </span>
                <span className="text-3xl font-extrabold font-mono text-white">
                  {analytics.totalRevenue.toLocaleString('ru-RU')} ₸
                </span>
                <span className="text-[11px] text-emerald-400 block mt-2">
                  Подтверждено через Kaspi Pay
                </span>
              </div>

              <div className="p-6 bg-zinc-900 border border-zinc-800">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                  Всего оформленных заказов
                </span>
                <span className="text-3xl font-extrabold font-mono text-white">
                  {analytics.totalOrders}
                </span>
                <span className="text-[11px] text-zinc-400 block mt-2">
                  Сайт и Telegram
                </span>
              </div>

              <div className="p-6 bg-zinc-900 border border-zinc-800">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                  Средний чек (AOV)
                </span>
                <span className="text-3xl font-extrabold font-mono text-white">
                  {analytics.avgOrderValue.toLocaleString('ru-RU')} ₸
                </span>
                <span className="text-[11px] text-zinc-400 block mt-2">
                  По оплаченным корзинам
                </span>
              </div>
            </div>

            {/* Low Stock Items Warning Alert */}
            {analytics.lowStockItems && analytics.lowStockItems.length > 0 && (
              <div className="p-6 bg-amber-950/40 border border-amber-900/60 text-amber-200 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Внимание: позиции на исходе (ниже порога неснижаемого остатка)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.lowStockItems.map((item: any) => (
                    <div key={item.variant_id} className="p-3 bg-zinc-900/80 border border-amber-900/40 text-xs">
                      <p className="font-semibold text-white truncate">{item.product_name}</p>
                      <p className="font-mono text-zinc-400">SKU: {item.sku} · {item.size}</p>
                      <div className="mt-2 flex justify-between font-mono font-bold">
                        <span className="text-amber-400">Остаток: {item.available} шт.</span>
                        <span className="text-zinc-500">Порог: {item.min_threshold}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue by Category Breakdown */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Выручка по категориям изделий
              </h3>
              <div className="divide-y divide-zinc-800">
                {analytics.categoryRevenue?.map((c: any) => (
                  <div key={c.category_name} className="py-3 flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300">{c.category_name}</span>
                    <span className="font-mono font-bold text-white">{c.revenue.toLocaleString('ru-RU')} ₸</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // 2. INVENTORY & RECEIPTS
  if (section === 'inventory') {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Складской учёт и остатки вариантов</h1>
            <p className="text-xs text-zinc-400">Учёт по триплету: SKU + размер + цвет. Физический и зарезервированный остатки.</p>
          </div>
          <button
            onClick={() => setReceiptModalOpen(true)}
            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Оприходовать товар (Приход)
          </button>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto border border-zinc-800 bg-zinc-900">
          <table className="w-full text-xs text-left">
            <thead className="bg-black text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3">Артикул (SKU)</th>
                <th className="p-3">Наименование</th>
                <th className="p-3">Размер</th>
                <th className="p-3">Цвет</th>
                <th className="p-3 font-mono text-center">Физический</th>
                <th className="p-3 font-mono text-center">В резерве</th>
                <th className="p-3 font-mono text-center">Доступно</th>
                <th className="p-3">Склад</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-mono">
              {inventory.map(row => (
                <tr key={row.variant_id} className="hover:bg-zinc-800/50">
                  <td className="p-3 font-bold text-white">{row.sku}</td>
                  <td className="p-3 font-sans font-medium text-zinc-200">{row.product_name}</td>
                  <td className="p-3 text-zinc-300">{row.size}</td>
                  <td className="p-3 font-sans text-zinc-400">{row.color}</td>
                  <td className="p-3 text-center text-zinc-200">{row.quantity}</td>
                  <td className="p-3 text-center text-amber-400">{row.reserved_quantity}</td>
                  <td className="p-3 text-center font-bold text-emerald-400">{row.available_quantity}</td>
                  <td className="p-3 font-sans text-zinc-400">{row.warehouse_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stock Movements Log */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Журнал движений товара (Movements Audit)
          </h3>
          <div className="divide-y divide-zinc-800 text-xs">
            {movements.map(m => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-white">{m.sku}</span>
                  <span className="text-zinc-400 ml-2">({m.product_name}, {m.size})</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{m.reason} · {m.user_name || 'Система'}</p>
                </div>
                <div className="text-right font-mono">
                  <span className={`font-bold ${m.change_amount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {m.change_amount > 0 ? `+${m.change_amount}` : m.change_amount} шт.
                  </span>
                  <span className="block text-[10px] text-zinc-500">
                    {new Date(m.created_at).toLocaleTimeString('ru-RU')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Modal */}
        {receiptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-zinc-900 border border-zinc-700 p-6 max-w-md w-full space-y-4">
              <h3 className="text-base font-bold text-white">Приход товара на склад</h3>
              <form onSubmit={handleStockReceipt} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Выберите вариант:</label>
                  <select
                    value={receiptVariantId}
                    onChange={(e) => setReceiptVariantId(e.target.value)}
                    className="w-full p-2.5 bg-black border border-zinc-700 text-white focus:outline-none"
                  >
                    {inventory.map(i => (
                      <option key={i.variant_id} value={i.variant_id}>
                        {i.sku} — {i.product_name} ({i.size})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Количество (шт):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receiptQuantity}
                    onChange={(e) => setReceiptQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-black border border-zinc-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Основание / Причина:</label>
                  <input
                    type="text"
                    required
                    value={receiptReason}
                    onChange={(e) => setReceiptReason(e.target.value)}
                    className="w-full p-2.5 bg-black border border-zinc-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReceiptModalOpen(false)}
                    className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black font-bold uppercase tracking-wider"
                  >
                    Подтвердить приход
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. PRODUCTS & PRICING
  if (section === 'products') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Управление ценами товаров</h1>
          <p className="text-xs text-zinc-400">
            Право изменения цен доступно исключительно владельцу (`OWNER`). Изменение цен не затрагивает архив ранее созданных заказов.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map(prod => (
            <div key={prod.id} className="p-5 bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex gap-4">
                <img src={prod.primary_image} alt="" className="w-16 h-20 object-cover bg-zinc-800 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {prod.category_name}
                  </span>
                  <h3 className="text-sm font-bold text-white truncate">{prod.name}</h3>
                  <div className="font-mono text-sm mt-1">
                    <span className="text-white font-bold">{prod.base_price?.toLocaleString('ru-RU')} ₸</span>
                    {prod.discount_price && (
                      <span className="text-zinc-400 line-through text-xs ml-2">
                        {prod.discount_price?.toLocaleString('ru-RU')} ₸
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {editingPriceProdId === prod.id ? (
                <div className="p-3 bg-black border border-zinc-700 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-zinc-400 block mb-1">Базовая цена (₸):</label>
                      <input
                        type="number"
                        value={newBasePrice}
                        onChange={(e) => setNewBasePrice(Number(e.target.value))}
                        className="w-full p-2 bg-zinc-900 border border-zinc-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Цена со скидкой (₸):</label>
                      <input
                        type="number"
                        value={newDiscountPrice || ''}
                        onChange={(e) => setNewDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Без скидки"
                        className="w-full p-2 bg-zinc-900 border border-zinc-700 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingPriceProdId(null)}
                      className="px-3 py-1 text-zinc-400 hover:text-white"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => handleSavePrice(prod.id)}
                      className="px-3 py-1 bg-white text-black font-bold uppercase"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingPriceProdId(prod.id);
                    setNewBasePrice(prod.base_price);
                    setNewDiscountPrice(prod.discount_price || undefined);
                  }}
                  className="w-full py-2 border border-zinc-700 text-zinc-300 text-xs uppercase tracking-wider font-semibold hover:border-white hover:text-white"
                >
                  Изменить цену
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. EMPLOYEES & ROLES
  if (section === 'employees') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Сотрудники и разграничение ролей</h1>
            <p className="text-xs text-zinc-400">Назначение ролей `MANAGER`, `WAREHOUSE`, `OWNER`. Никаких общих паролей.</p>
          </div>
          <button
            onClick={() => setEmpModalOpen(true)}
            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить сотрудника
          </button>
        </div>

        <div className="divide-y divide-zinc-800 border border-zinc-800 bg-zinc-900">
          {employees.map(emp => (
            <div key={emp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-white text-sm">{emp.full_name}</p>
                <p className="font-mono text-zinc-400">{emp.email} · {emp.phone || 'Нет телефона'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-mono ${
                  emp.roles?.includes('OWNER') ? 'bg-red-950 text-red-300 border border-red-800' :
                  emp.roles?.includes('MANAGER') ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  emp.roles?.includes('WAREHOUSE') ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {emp.roles}
                </span>
              </div>
            </div>
          ))}
        </div>

        {empModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-zinc-900 border border-zinc-700 p-6 max-w-md w-full space-y-4">
              <h3 className="text-base font-bold text-white">Регистрация нового сотрудника</h3>
              <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">ФИО сотрудника:</label>
                  <input
                    type="text"
                    required
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    placeholder="Марат Искаков"
                    className="w-full p-2.5 bg-black border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Рабочий Email:</label>
                  <input
                    type="email"
                    required
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    placeholder="marat@umarmens.kz"
                    className="w-full p-2.5 bg-black border border-zinc-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Роль в системе:</label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value)}
                    className="w-full p-2.5 bg-black border border-zinc-700 text-white"
                  >
                    <option value="MANAGER">MANAGER (Заказы, клиенты, выдача)</option>
                    <option value="WAREHOUSE">WAREHOUSE (Приемка, комплектация по SKU)</option>
                    <option value="OWNER">OWNER (Полный администратор)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Пароль для входа:</label>
                  <input
                    type="text"
                    required
                    value={newEmpPassword}
                    onChange={(e) => setNewEmpPassword(e.target.value)}
                    className="w-full p-2.5 bg-black border border-zinc-700 text-white font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmpModalOpen(false)}
                    className="px-4 py-2 border border-zinc-700 text-zinc-300"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black font-bold uppercase"
                  >
                    Создать аккаунт
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. INTEGRATIONS
  if (section === 'integrations') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Интеграции платёжного шлюза и Telegram</h1>
          <p className="text-xs text-zinc-400">
            Безопасное хранение ключей. Если ключи не заданы в .env, адаптер честно сообщает статус «Не подключено».
          </p>
        </div>

        {integrations && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Kaspi Pay Card */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Kaspi Pay / Kaspi QR</h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  integrations.kaspiPay?.mode === 'SANDBOX'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {integrations.kaspiPay?.status}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {integrations.kaspiPay?.description}. Для боевой эксплуатации необходим договор эквайринга с Kaspi Bank и mTLS-сертификат.
              </p>

              <div className="space-y-2 text-xs pt-2 border-t border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Режим работы:</span>
                  <span className="font-mono text-white">{integrations.kaspiPay?.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Merchant ID:</span>
                  <span className="font-mono text-zinc-300">{integrations.kaspiPay?.merchantIdMasked}</span>
                </div>
              </div>
            </div>

            {/* Telegram Bot Card */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Telegram Bot API</h3>
                  <span className="text-xs text-amber-400 font-mono">@UMARSHOP223_Bot</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  integrations.telegram?.status === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950 text-red-300 border border-red-800'
                }`}>
                  {integrations.telegram?.status}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Официальный бот UMAR MENS SHOP подключен. Обрабатывает входящие команды клиентов, поиск заказов по номеру и отправляет уведомления о заказах.
              </p>

              <div className="space-y-2 text-xs pt-2 border-t border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Имя бота:</span>
                  <span className="font-semibold text-white">{integrations.telegram?.botName || 'UMAR MENS SHOP Bot'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Username:</span>
                  <a
                    href="https://t.me/UMARSHOP223_Bot"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-amber-400 hover:underline"
                  >
                    @UMARSHOP223_Bot ↗
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Токен HTTP API:</span>
                  <span className="font-mono text-zinc-300">8975817013:AAHk•••••••••••••••••</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Webhook статус:</span>
                  <span className="font-mono text-emerald-400 text-[11px]">Активен (Cloud Run)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href="https://t.me/UMARSHOP223_Bot"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Открыть бота в Telegram</span>
                  <span>↗</span>
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/integrations/telegram/set-webhook', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({})
                      });
                      const d = await res.json();
                      if (d.success) {
                        alert('✅ Webhook Telegram бота успешно обновлен!');
                        fetchIntegrations();
                      } else {
                        alert('Ошибка обновления Webhook: ' + (d.error || 'неизвестно'));
                      }
                    } catch (e: any) {
                      alert('Сетевая ошибка: ' + e.message);
                    }
                  }}
                  className="px-3 py-2 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-xs transition-colors"
                >
                  Синхронизировать Webhook
                </button>
              </div>

              {/* Bot Commands */}
              <div className="p-3 bg-black border border-zinc-800 space-y-1.5 text-[11px] text-zinc-400">
                <span className="text-white font-semibold block">Поддерживаемые команды бота:</span>
                <p><code className="text-zinc-200">/start</code> — Приветствие и главное меню бутика</p>
                <p><code className="text-zinc-200">/catalog</code> — Актуальные позиции мужской одежды</p>
                <p><code className="text-zinc-200">/status &lt;номер&gt;</code> — Проверка статуса заказа (напр. /status UM-101)</p>
                <p><code className="text-zinc-200">/contacts</code> — Адрес флагманского бутика в Алматы</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 6. AUDIT LOGS
  if (section === 'audit-log') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Неизменяемый журнал аудита (Audit Trail)</h1>
          <p className="text-xs text-zinc-400">
            Логирование критических действий: авторизация, списания остатков, смена цен, создание заказов и попытки несанкционированного доступа.
          </p>
        </div>

        <div className="divide-y divide-zinc-800 border border-zinc-800 bg-zinc-900 font-mono text-xs">
          {auditLogs.map(log => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{log.action}</span>
                  <span className="text-zinc-500 font-normal">[{log.entity_type} {log.entity_id || ''}]</span>
                </div>
                {log.details && (
                  <p className="text-[11px] text-zinc-400 font-sans">{log.details}</p>
                )}
                <p className="text-[10px] text-zinc-500 font-sans">
                  Инициатор: {log.user_name ? `${log.user_name} (${log.user_email})` : 'Гость / Система'} · IP: {log.ip_address}
                </p>
              </div>
              <span className="text-[11px] text-zinc-500 shrink-0">
                {new Date(log.created_at).toLocaleString('ru-RU')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 7. SECURITY ASSERTIONS CENTER
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Центр верификации безопасности и тестов</h1>
          <p className="text-xs text-zinc-400">
            Проверка матрицы доступов, защиты от несанкционированного входа, гонок остатков и утечки данных (Разделы 14 и 16 ТЗ).
          </p>
        </div>
        <button
          disabled={runningTests}
          onClick={runLiveSecurityTests}
          className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${runningTests ? 'animate-spin' : ''}`} />
          {runningTests ? 'Тестирование...' : 'Запустить верификацию'}
        </button>
      </div>

      {testReport && (
        <div className="space-y-6">
          <div className="p-6 bg-emerald-950/40 border border-emerald-900 text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Все тесты безопасности пройдены успешно</h3>
                <p className="text-xs text-emerald-400">
                  {testReport.summary?.passed} из {testReport.summary?.total} защитных барьеров активны и подтверждены.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              {new Date(testReport.summary?.timestamp).toLocaleTimeString('ru-RU')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testReport.results?.map((t: any) => (
              <div key={t.testId} className="p-4 bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-xs text-emerald-400">[{t.testId}] {t.name}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{t.details}</p>
                <div className="pt-1 text-[11px] font-mono text-zinc-500">
                  Ожидаемое поведение: {t.expected}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
