import React from 'react';
import { Home, LayoutGrid, Heart, ShoppingBag, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentPath, onNavigate }) => {
  const { itemCount, openCart } = useCart();
  const { favoritesCount } = useFavorites();
  const { user } = useAuth();

  const navItems = [
    {
      id: 'home',
      label: 'Главная',
      icon: Home,
      isActive: currentPath === '/',
      onClick: () => onNavigate('/')
    },
    {
      id: 'catalog',
      label: 'Каталог',
      icon: LayoutGrid,
      isActive: currentPath.startsWith('/catalog'),
      onClick: () => onNavigate('/catalog')
    },
    {
      id: 'favorites',
      label: 'Избранное',
      icon: Heart,
      badge: favoritesCount,
      isActive: currentPath === '/account/favorites',
      onClick: () => onNavigate('/account/favorites')
    },
    {
      id: 'cart',
      label: 'Корзина',
      icon: ShoppingBag,
      badge: itemCount,
      isActive: false,
      onClick: openCart
    },
    {
      id: 'profile',
      label: !user ? 'Войти' : user.roles.includes('OWNER') ? 'Владелец' : user.roles.includes('MANAGER') ? 'Менеджер' : user.roles.includes('WAREHOUSE') ? 'Склад' : 'Кабинет',
      icon: UserIcon,
      isActive: currentPath.startsWith('/account') || currentPath.startsWith('/admin') || currentPath.startsWith('/staff'),
      onClick: () => {
        if (!user) onNavigate('/login');
        else if (user.roles.includes('OWNER')) onNavigate('/admin');
        else if (user.roles.includes('MANAGER')) onNavigate('/staff/orders');
        else if (user.roles.includes('WAREHOUSE')) onNavigate('/staff/warehouse');
        else onNavigate('/account');
      }
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[56px] text-zinc-400 transition-colors focus:outline-none"
            >
              {/* Active subtle indicator */}
              {item.isActive && (
                <motion.div
                  layoutId="mobileNavActive"
                  className="absolute -top-1.5 w-8 h-0.5 bg-white"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    item.isActive ? 'text-white scale-110 stroke-[2.2]' : 'text-zinc-500 stroke-[1.6]'
                  }`}
                />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-2 bg-white text-black text-[9px] font-bold font-mono min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-0.5">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
                  item.isActive ? 'text-white font-semibold' : 'text-zinc-400 font-normal'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
