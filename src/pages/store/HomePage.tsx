import React, { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Heart, Sparkles, ChevronRight, Compass, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { Product } from '../../types';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { useFavorites } from '../../context/FavoritesContext';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    fetch('/api/catalog/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });
  }, []);

  const editorialLooks = [
    {
      id: 'look-1',
      title: 'Monochrome Tailoring',
      category: 'Костюмы',
      tag: 'SUPER 130s',
      path: '/catalog/suits',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 'look-2',
      title: 'Structural Cashmere',
      category: 'Пальто',
      tag: 'PURE CASHMERE',
      path: '/catalog/coats',
      image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 'look-3',
      title: 'The Sartorial Shirt',
      category: 'Сорочки',
      tag: 'GIZA 87 COTTON',
      path: '/catalog/shirts',
      image: 'https://images.unsplash.com/photo-1620012253295-c15c429fbb41?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 'look-4',
      title: 'Elevated Knitwear',
      category: 'Вязаные поло',
      tag: 'EXTRAFINE MERINO',
      path: '/catalog/knitwear',
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000'
    }
  ];

  return (
    <div className="bg-black text-white selection:bg-white selection:text-black min-h-screen">
      
      {/* =====================================================================
          1. CINEMATIC HERO SECTION (DARK EDITORIAL & BOLD LUXURY)
         ===================================================================== */}
      <section className="relative min-h-[85vh] lg:min-h-[92vh] flex items-center border-b border-zinc-900 overflow-hidden px-4 sm:px-6 lg:px-8">
        
        {/* Subtle geometric grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: Bold Typography & Brand Direction */}
          <div className="lg:col-span-7 space-y-6 lg:space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-3"
            >
              <span className="w-6 h-px bg-zinc-400" />
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400">
                Almaty Flagship · Dostyk 128
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2"
            >
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight uppercase leading-[0.95] text-white">
                Архитектура <br />
                <span className="text-zinc-500 font-light italic lowercase">мужского</span> кроя
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed font-normal"
            >
              Костюмы итальянских лекал из шерсти Super 130s, пальто из двойного кашемира и рубашки из египетского хлопка Giza. 
              Индивидуальная посадка, статусная сдержанность и курьерская примерка по Алматы.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              <button
                onClick={() => onNavigate('/catalog')}
                className="px-8 py-4 bg-white text-black text-xs uppercase tracking-[0.2em] font-extrabold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Исследовать каталог</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigate('/catalog/suits')}
                className="px-8 py-4 bg-transparent border border-zinc-700 text-zinc-300 text-xs uppercase tracking-[0.2em] font-semibold hover:border-white hover:text-white transition-all text-center"
              >
                Костюмы Super 130s
              </button>
            </motion.div>

            {/* Micro specs rail */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-6 border-t border-zinc-900 grid grid-cols-3 gap-4 text-xs font-mono"
            >
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Ткани</span>
                <span className="text-zinc-300 font-semibold">Biella, Италия</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Примерка</span>
                <span className="text-zinc-300 font-semibold">Алматы (1 день)</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Оплата</span>
                <span className="text-zinc-300 font-semibold">Kaspi Pay QR</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: High-Impact Campaign Mockup & Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
              {/* Campaign attachment image */}
              <img
                src="/assets/aistudio/1234.jpg"
                alt="UMAR MENS SHOP Campaign"
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Floating Editorial Badge */}
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 backdrop-blur-md border border-zinc-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 block font-mono">
                    Official Campaign
                  </span>
                  <span className="text-white font-bold text-sm tracking-tight">
                    FW26 Editorial Collection
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('/catalog/coats')}
                  className="p-2 bg-white text-black hover:bg-zinc-200 transition-colors"
                  aria-label="Смотреть пальто"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          2. BRAND TRUST & SERVICE PILLARS
         ===================================================================== */}
      <section className="border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <Truck className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5 stroke-[1.75]" />
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-white">Примерка смежных размеров</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Курьер доставит 2–3 размера для комфортной примерки дома или в офисе. Бесплатно от 100 000 ₸.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5 stroke-[1.75]" />
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-white">100% Европейские фабрики</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Сертифицированная мериносовая шерсть Super 130s (Италия) и длинноволокнистый хлопок Giza 87.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <RefreshCw className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5 stroke-[1.75]" />
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-white">Платёжный шлюз Kaspi Pay</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Мгновенная оплата через официальный QR-код приложения Kaspi.kz без скрытых комиссий.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. EDITORIAL LOOKS / CATEGORY RAILS
         ===================================================================== */}
      <section className="py-16 sm:py-24 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                Гардеробная капсула
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Категории коллекции
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/catalog')}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <span>Смотреть весь каталог</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {editorialLooks.map((look, index) => (
              <motion.div
                key={look.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                onClick={() => onNavigate(look.path)}
                className="group cursor-pointer relative bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col"
              >
                <div className="aspect-[3/4] overflow-hidden relative">
                  <ImageWithFallback
                    src={look.image}
                    alt={look.title}
                    aspectRatio="aspect-[3/4]"
                    categoryName="UMAR"
                    className="group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  {/* Subtle Corner Tag */}
                  <span className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-black/70 backdrop-blur-xs text-zinc-300 border border-zinc-800">
                    {look.tag}
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex items-center justify-between border-t border-zinc-800 bg-zinc-950">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                      {look.category}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-zinc-300 transition-colors">
                      {look.title}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-none border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:border-white group-hover:text-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. FEATURED PRODUCTS (РЕАЛЬНЫЕ ТОВАРЫ ИЗ БАЗЫ)
         ===================================================================== */}
      <section className="py-16 sm:py-24 border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                Флагманы бутика
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Новые поступления в Алматы
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/catalog')}
              className="text-xs uppercase tracking-wider font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5"
            >
              <span>Все изделия</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="animate-pulse space-y-3 bg-zinc-900 p-3">
                  <div className="aspect-[3/4] bg-zinc-800" />
                  <div className="h-4 bg-zinc-800 w-3/4" />
                  <div className="h-4 bg-zinc-800 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.slice(0, 4).map(product => {
                const favorite = isFavorite(product.id);

                return (
                  <div
                    key={product.id}
                    className="group flex flex-col justify-between bg-zinc-900 border border-zinc-800/80 p-3 hover:border-zinc-700 transition-all"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-black mb-3">
                      <div
                        onClick={() => onNavigate(`/product/${product.slug}`)}
                        className="w-full h-full cursor-pointer"
                      >
                        <ImageWithFallback
                          src={product.primary_image}
                          alt={product.name}
                          aspectRatio="aspect-[3/4]"
                          categoryName={product.category_name}
                          className="group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product);
                        }}
                        className="absolute top-2.5 right-2.5 p-2 bg-black/80 backdrop-blur-xs text-zinc-400 hover:text-white rounded-none border border-zinc-800 shadow-sm transition-transform active:scale-90"
                        aria-label={favorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                      >
                        <Heart
                          className={`w-4 h-4 ${favorite ? 'fill-white text-white' : 'text-zinc-400'}`}
                        />
                      </button>

                      {/* Sale Tag */}
                      {product.discount_price && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white text-black text-[9px] font-mono font-bold uppercase tracking-wider">
                          Special Offer
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => onNavigate(`/product/${product.slug}`)}
                      className="cursor-pointer space-y-1"
                    >
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-medium block">
                        {product.category_name}
                      </span>
                      <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-zinc-300 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 pt-1 font-mono text-xs sm:text-sm">
                        {product.discount_price ? (
                          <>
                            <span className="font-bold text-white">
                              {product.discount_price.toLocaleString('ru-RU')} ₸
                            </span>
                            <span className="line-through text-[11px] text-zinc-600">
                              {product.base_price.toLocaleString('ru-RU')} ₸
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-white">
                            {product.base_price.toLocaleString('ru-RU')} ₸
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          5. ARTISANAL CRAFTSMANSHIP & ATELIER STORY
         ===================================================================== */}
      <section className="py-20 sm:py-32 border-b border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-500">
                Philosophy of Sartorialism
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-[1.05]">
                Безупречная посадка без компромиссов
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Каждый костюм UMAR MENS кроится по канонам неаполитанской и миланской школ: 
                мягкое плечо, полуподкладка из натурального купро для легкости движений и роговые пуговицы ручной обработки.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-900">
                <div>
                  <span className="block text-2xl sm:text-3xl font-bold font-mono text-white">Super 130s</span>
                  <span className="text-[11px] text-zinc-500 mt-1 block font-mono">Шерсть мериноса, провинция Бьелла</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-bold font-mono text-white">100% Giza 87</span>
                  <span className="text-[11px] text-zinc-500 mt-1 block font-mono">Длинноволокнистый хлопок</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onNavigate('/contacts')}
                  className="px-6 py-3 border border-zinc-700 hover:border-white text-xs uppercase tracking-wider font-semibold text-white transition-colors"
                >
                  Записаться на примерку в бутик →
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=1200"
                  alt="Портновское мастерство UMAR MENS"
                  aspectRatio="aspect-[4/3]"
                  categoryName="ATELIER"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
