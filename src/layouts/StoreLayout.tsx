import React, { useState } from 'react';
import { ShoppingBag, Search, X, Heart, Menu, ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface StoreLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const StoreLayout: React.FC<StoreLayoutProps> = ({ children, activePath, onNavigate }) => {
  const { items, itemCount, subtotal, isCartOpen, openCart, closeCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const { favoritesCount } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 100000;
  const progressToFreeShipping = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black antialiased">
      {/* 1. Slim Top Bar Announcement */}
      <div className="bg-zinc-950 text-zinc-400 text-xs py-2 px-4 text-center tracking-wider uppercase border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] font-mono">
          <span>Бесплатная экспресс-доставка по Алматы от 100 000 ₸</span>
          <span className="text-zinc-700 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-zinc-500 hidden sm:inline">Флагманский бутик: пр. Достык, 128</span>
        </div>
      </div>

      {/* 2. Primary Header (Clean 3-Zone Contract in Dark Editorial Style) */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
          
          {/* Zone 1: Official Brand Mark */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white focus:outline-none"
              aria-label="Открыть меню коллекций"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('/')}
              className="text-left flex items-center gap-3 focus:outline-none group"
            >
              <img
                src="/assets/aistudio/_____cecc8cff.jpg"
                alt="UMAR MENS SHOP"
                className="h-10 sm:h-11 w-auto object-contain bg-black px-2 py-1 rounded border border-zinc-800"
              />
              <div className="hidden sm:block">
                <span className="block text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-mono">
                  Almaty · Boutique
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Single-Line, No Pills) */}
          <nav className="hidden lg:flex items-center gap-8 text-xs tracking-[0.15em] uppercase font-semibold text-zinc-400">
            <button
              onClick={() => onNavigate('/catalog')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activePath === '/catalog' ? 'text-white' : ''}`}
            >
              Весь каталог
            </button>
            <button
              onClick={() => onNavigate('/catalog/suits')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activePath.includes('/suits') ? 'text-white' : ''}`}
            >
              Костюмы
            </button>
            <button
              onClick={() => onNavigate('/catalog/coats')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activePath.includes('/coats') ? 'text-white' : ''}`}
            >
              Пальто
            </button>
            <button
              onClick={() => onNavigate('/catalog/shirts')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activePath.includes('/shirts') ? 'text-white' : ''}`}
            >
              Рубашки
            </button>
            <button
              onClick={() => onNavigate('/catalog/knitwear')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activePath.includes('/knitwear') ? 'text-white' : ''}`}
            >
              Вязаные поло
            </button>
          </nav>

          {/* Zone 3: Actions (Search, Wishlist, Account, Cart) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Search */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск костюмов, пальто..."
                    autoFocus
                    className="w-44 sm:w-64 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 text-white rounded-none focus:outline-none focus:border-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                  title="Поиск изделий"
                  aria-label="Поиск"
                >
                  <Search className="w-5 h-5 stroke-[1.6]" />
                </button>
              )}
            </div>

            {/* Wishlist Heart Button */}
            <button
              onClick={() => onNavigate(user ? '/account/favorites' : '/catalog')}
              className="relative p-2 text-zinc-400 hover:text-white transition-colors hidden sm:inline-flex"
              title="Избранные изделия"
              aria-label="Избранное"
            >
              <Heart className="w-5 h-5 stroke-[1.6]" />
              {favoritesCount > 0 && (
                <span className="absolute top-1 right-1 bg-white text-black text-[9px] font-bold w-4 h-4 rounded-none flex items-center justify-center font-mono">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Track Order */}
            <button
              onClick={() => onNavigate('/track-order')}
              className="hidden md:inline-flex items-center text-xs tracking-wider uppercase font-medium text-zinc-400 hover:text-white px-2 py-1 transition-colors"
            >
              Отследить
            </button>

            {/* Role-Specific Portal or Login */}
            <button
              onClick={() => {
                if (!user) onNavigate('/login');
                else if (user.roles.includes('OWNER')) onNavigate('/admin');
                else if (user.roles.includes('MANAGER')) onNavigate('/staff/orders');
                else if (user.roles.includes('WAREHOUSE')) onNavigate('/staff/warehouse');
                else onNavigate('/account');
              }}
              className="hidden sm:inline-flex text-xs tracking-[0.15em] uppercase font-semibold px-3 py-1.5 border border-zinc-700 hover:border-white transition-colors text-white"
            >
              {!user ? 'Войти' : user.roles.includes('OWNER') ? 'Панель владельца' : user.roles.includes('MANAGER') ? 'Менеджер' : user.roles.includes('WAREHOUSE') ? 'Склад' : 'Кабинет'}
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={openCart}
              className="relative p-2 text-white hover:text-zinc-300 transition-colors"
              aria-label="Корзина покупок"
            >
              <ShoppingBag className="w-6 h-6 stroke-[1.6]" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-none flex items-center justify-center font-mono">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-6 space-y-3">
            <button
              onClick={() => { onNavigate('/catalog'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-sm font-medium text-zinc-200 border-b border-zinc-900"
            >
              Весь каталог
            </button>
            <button
              onClick={() => { onNavigate('/catalog/suits'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-sm font-medium text-zinc-200 border-b border-zinc-900"
            >
              Костюмы Super 130s
            </button>
            <button
              onClick={() => { onNavigate('/catalog/coats'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-sm font-medium text-zinc-200 border-b border-zinc-900"
            >
              Кашемировые пальто
            </button>
            <button
              onClick={() => { onNavigate('/catalog/shirts'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-sm font-medium text-zinc-200 border-b border-zinc-900"
            >
              Рубашки Giza 87
            </button>
            <button
              onClick={() => { onNavigate('/catalog/knitwear'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-sm font-medium text-zinc-200 border-b border-zinc-900"
            >
              Вязаные поло & Трикотаж
            </button>
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 font-mono">
              <button onClick={() => { onNavigate('/track-order'); setMobileMenuOpen(false); }}>
                Отследить заказ
              </button>
              <button onClick={() => { onNavigate('/contacts'); setMobileMenuOpen(false); }}>
                Контакты бутика
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Floating Bottom Nav Dock */}
      <MobileBottomNav currentPath={activePath} onNavigate={onNavigate} />

      {/* 3. Dark Slide-Over Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
              onClick={closeCart}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md bg-zinc-950 text-white border-l border-zinc-800 h-full shadow-2xl flex flex-col z-10"
            >
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-white uppercase">Ваша корзина</h2>
                  <p className="text-xs text-zinc-500 font-mono">
                    {itemCount} {itemCount === 1 ? 'изделие' : 'изделий'}
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Закрыть корзину"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Progress Indicator */}
              {items.length > 0 && (
                <div className="bg-zinc-900/60 px-5 py-3 border-b border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-zinc-400" />
                      {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                        <span className="font-semibold text-emerald-400">Бесплатная доставка по Алматы доступна!</span>
                      ) : (
                        <span>До бесплатной доставки: <strong className="font-mono text-white">{remainingForFreeShipping.toLocaleString('ru-RU')} ₸</strong></span>
                      )}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">{Math.round(progressToFreeShipping)}%</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${subtotal >= FREE_SHIPPING_THRESHOLD ? 'bg-emerald-500' : 'bg-white'}`}
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-5 divide-y divide-zinc-900">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12">
                    <ShoppingBag className="w-12 h-12 text-zinc-700 stroke-[1] mb-3" />
                    <p className="text-base font-semibold text-white">В корзине пока пусто</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      Ознакомьтесь с новыми поступлениями костюмов и пальто в каталоге
                    </p>
                    <button
                      onClick={() => { closeCart(); onNavigate('/catalog'); }}
                      className="mt-6 px-6 py-3 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors"
                    >
                      Перейти в каталог
                    </button>
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.variantId} className="py-4 flex gap-4 items-center">
                      <div className="w-18 h-22 shrink-0 border border-zinc-800 overflow-hidden">
                        <ImageWithFallback
                          src={item.imageUrl}
                          alt={item.productName}
                          aspectRatio="aspect-[3/4]"
                          categoryName="UMAR"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-xs font-semibold text-white truncate">{item.productName}</h3>
                        <p className="text-xs text-zinc-400">
                          Размер: <span className="font-mono text-white font-medium">{item.size}</span> · Цвет: {item.color}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">Арт: {item.sku}</p>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center border border-zinc-800 bg-zinc-900">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                              aria-label="Уменьшить"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 text-xs font-mono font-medium text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                              aria-label="Увеличить"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-bold font-mono text-white">
                            {(item.price * item.quantity).toLocaleString('ru-RU')} ₸
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {items.length > 0 && (
                <div className="p-5 border-t border-zinc-800 bg-zinc-900/60 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Сумма заказа:</span>
                    <span className="font-bold font-mono text-base text-white">{subtotal.toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <span>Примерка по Алматы. Оплата через Kaspi Pay QR.</span>
                  </div>
                  <button
                    onClick={() => { closeCart(); onNavigate('/checkout'); }}
                    className="w-full py-4 bg-white text-black text-xs uppercase tracking-widest font-extrabold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                  >
                    Оформить заказ
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Luxury Dark Brand Footer */}
      <footer className="bg-zinc-950 text-white pt-16 pb-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-zinc-900">
            {/* Brand column */}
            <div className="md:col-span-1 space-y-4">
              <img
                src="/assets/aistudio/_____cecc8cff.jpg"
                alt="UMAR MENS SHOP"
                className="h-10 w-auto object-contain bg-black px-2 py-1 rounded border border-zinc-800"
              />
              <p className="text-xs text-zinc-400 leading-relaxed">
                Премиальный бутик мужской классической и smart-casual одежды в Алматы. Безупречный крой, натуральные ткани Biella и персональный сервис.
              </p>
              <div className="text-xs text-zinc-500 space-y-1 font-mono">
                <p>г. Алматы, пр. Достык, 128</p>
                <p>Ежедневно: 10:00 – 21:00</p>
              </div>
            </div>

            {/* Catalog Collections */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-300 mb-4">Коллекции</h4>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li><button onClick={() => onNavigate('/catalog/suits')} className="hover:text-white transition-colors">Костюмы Super 130s</button></li>
                <li><button onClick={() => onNavigate('/catalog/coats')} className="hover:text-white transition-colors">Пальто из кашемира</button></li>
                <li><button onClick={() => onNavigate('/catalog/shirts')} className="hover:text-white transition-colors">Рубашки Giza 87</button></li>
                <li><button onClick={() => onNavigate('/catalog/knitwear')} className="hover:text-white transition-colors">Вязаные поло и трикотаж</button></li>
                <li><button onClick={() => onNavigate('/catalog/shoes')} className="hover:text-white transition-colors">Обувь ручной работы</button></li>
              </ul>
            </div>

            {/* Client Service */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-300 mb-4">Клиентский сервис</h4>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li><button onClick={() => onNavigate('/delivery')} className="hover:text-white transition-colors">Доставка и оплата Kaspi QR</button></li>
                <li><button onClick={() => onNavigate('/returns')} className="hover:text-white transition-colors">Условия примерки и возврата</button></li>
                <li><button onClick={() => onNavigate('/track-order')} className="hover:text-white transition-colors">Отследить статус заказа</button></li>
                <li><button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">О бутике UMAR MENS</button></li>
                <li><button onClick={() => onNavigate('/contacts')} className="hover:text-white transition-colors">Контакты и адрес</button></li>
              </ul>
            </div>

            {/* Payment & Trust */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-300 mb-4">Оплата и гарантии</h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Безопасная оплата через защищенный QR-код Kaspi Pay и банковские карты Казахстана. 100% гарантия подлинности европейских тканей.
              </p>
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-[11px]">Kaspi Pay</span>
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-[11px]">Visa / MC</span>
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-[11px]">Apple Pay</span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 font-mono">
            <p>© 2026 UMAR MENS SHOP. Все права защищены. Алматы, Казахстан.</p>
            <div className="flex gap-6">
              <button onClick={() => onNavigate('/privacy')} className="hover:text-zinc-300">Политика конфиденциальности</button>
              <button onClick={() => onNavigate('/terms')} className="hover:text-zinc-300">Условия обслуживания</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
