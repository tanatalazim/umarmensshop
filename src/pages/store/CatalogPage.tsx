import React, { useEffect, useState } from 'react';
import { Filter, SlidersHorizontal, Grid, Columns, Heart, X, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product, Category } from '../../types';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { useFavorites } from '../../context/FavoritesContext';

interface CatalogPageProps {
  initialCategory?: string;
  onNavigate: (path: string) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ initialCategory, onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState<1 | 2>(2);

  const { isFavorite, toggleFavorite } = useFavorites();

  // Sync initialCategory prop change
  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Load categories
  useEffect(() => {
    fetch('/api/catalog/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // Load products based on filters
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSize) params.set('size', selectedSize);
    if (sortOption) params.set('sort', sortOption);

    fetch(`/api/catalog/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load filtered products:', err);
        setLoading(false);
      });
  }, [selectedCategory, selectedSize, sortOption]);

  const availableSizes = [
    '39 (S)', '40 (M)', '41 (L)', '42 (XL)',
    '48 (M)', '50 (L)', '52 (XL)', '54 (XXL)',
    'S', 'M', 'L', 'XL',
    '41 EU', '42 EU', '43 EU', '44 EU'
  ];

  const activeFiltersCount = (selectedCategory ? 1 : 0) + (selectedSize ? 1 : 0);

  return (
    <div className="bg-black text-white min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & Controls */}
        <div className="border-b border-zinc-900 pb-6">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">
            Коллекция 2026 · Алматы
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white">
                {selectedCategory
                  ? categories.find(c => c.slug === selectedCategory)?.name || 'Каталог'
                  : 'Все изделия коллекции'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                {products.length} {products.length === 1 ? 'модель' : 'моделей'} в наличии в бутике
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile View Switcher (1 vs 2 cols) */}
              <div className="sm:hidden flex items-center border border-zinc-800 bg-zinc-950 p-0.5">
                <button
                  type="button"
                  onClick={() => setGridCols(1)}
                  className={`p-1.5 ${gridCols === 1 ? 'bg-white text-black' : 'text-zinc-500'}`}
                  aria-label="1 колонка"
                >
                  <Columns className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setGridCols(2)}
                  className={`p-1.5 ${gridCols === 2 ? 'bg-white text-black' : 'text-zinc-500'}`}
                  aria-label="2 колонки"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="sm:hidden flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-zinc-800 bg-zinc-900 text-white"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Фильтры
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 bg-white text-black text-[10px] rounded-none flex items-center justify-center font-mono font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort Select */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">Сортировка:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="text-xs border border-zinc-800 py-1.5 px-3 bg-zinc-950 text-white focus:outline-none focus:border-white font-mono"
                >
                  <option value="newest">Сначала новинки</option>
                  <option value="price_asc">По возрастанию цены</option>
                  <option value="price_desc">По убыванию цены</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Category Tabs */}
        <div className="hidden sm:block space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 text-xs uppercase tracking-[0.15em] font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === ''
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Все изделия
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 text-xs uppercase tracking-[0.15em] font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sizes Filter Rail */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
            <span className="text-zinc-500 text-xs shrink-0 font-mono">Размер:</span>
            <button
              onClick={() => setSelectedSize('')}
              className={`px-2.5 py-1 text-xs font-mono border ${
                selectedSize === '' ? 'border-white bg-white text-black font-bold' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 bg-zinc-950'
              }`}
            >
              Все
            </button>
            {availableSizes.map(sz => (
              <button
                key={sz}
                onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                className={`px-2.5 py-1 text-xs border font-mono whitespace-nowrap ${
                  selectedSize === sz ? 'border-white bg-white text-black font-bold' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 bg-zinc-950'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 flex justify-end sm:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-xs"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative w-4/5 max-w-sm bg-zinc-950 text-white border-l border-zinc-800 h-full p-6 flex flex-col justify-between z-10 overflow-y-auto"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h3 className="text-base font-bold uppercase tracking-wider text-white">Фильтры каталога</h3>
                    <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2 font-mono">Категории</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`w-full text-left py-2 px-3 text-xs flex items-center justify-between ${
                          selectedCategory === '' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span>Все изделия</span>
                        {selectedCategory === '' && <Check className="w-4 h-4" />}
                      </button>
                      {categories.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategory(c.slug)}
                          className={`w-full text-left py-2 px-3 text-xs flex items-center justify-between ${
                            selectedCategory === c.slug ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span>{c.name}</span>
                          {selectedCategory === c.slug && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2 font-mono">Размеры</h4>
                    <div className="grid grid-cols-3 gap-1.5">
                      {availableSizes.map(sz => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                          className={`py-2 px-1 text-xs border font-mono text-center ${
                            selectedSize === sz ? 'border-white bg-white text-black font-bold' : 'border-zinc-800 text-zinc-400 bg-zinc-900'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sorting */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-2 font-mono">Сортировка</h4>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="w-full text-xs border border-zinc-800 py-2.5 px-3 bg-zinc-900 text-white font-mono"
                    >
                      <option value="newest">Сначала новинки</option>
                      <option value="price_asc">По возрастанию цены</option>
                      <option value="price_desc">По убыванию цены</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800 flex gap-2">
                  <button
                    onClick={() => { setSelectedCategory(''); setSelectedSize(''); }}
                    className="w-1/2 py-3 border border-zinc-800 text-xs font-semibold uppercase text-zinc-400 hover:text-white"
                  >
                    Сбросить
                  </button>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-1/2 py-3 bg-white text-black text-xs font-bold uppercase tracking-wider"
                  >
                    Применить
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        {loading ? (
          <div className={`grid ${gridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6`}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="animate-pulse space-y-3 bg-zinc-900 p-3 border border-zinc-800">
                <div className="aspect-[3/4] bg-zinc-800" />
                <div className="h-4 bg-zinc-800 w-3/4" />
                <div className="h-4 bg-zinc-800 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800 bg-zinc-950">
            <p className="text-base font-semibold text-white">По выбранным фильтрам изделия не найдены</p>
            <p className="text-xs text-zinc-500 mt-1">Попробуйте выбрать другой размер или категорию</p>
            <button
              onClick={() => { setSelectedCategory(''); setSelectedSize(''); }}
              className="mt-4 px-6 py-2.5 bg-white text-black text-xs uppercase tracking-wider font-bold"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className={`grid ${gridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6`}>
            {products.map(product => {
              const favorite = isFavorite(product.id);

              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between bg-zinc-900 border border-zinc-800/80 p-3 hover:border-zinc-600 transition-all"
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

                    {/* Favorite Heart Button */}
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

                    {/* Discount Tag */}
                    {product.discount_price && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white text-black text-[9px] font-mono font-bold uppercase tracking-wider">
                        Sale
                      </span>
                    )}

                    {/* Available Sizes Overlay */}
                    {product.availableSizes && product.availableSizes.length > 0 && (
                      <div className="hidden sm:flex absolute bottom-2 left-2 right-2 flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 p-2 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 w-full mb-0.5 font-mono">В наличии:</span>
                        {product.availableSizes.map(s => (
                          <span key={s} className="text-[10px] text-white font-mono bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => onNavigate(`/product/${product.slug}`)}
                    className="cursor-pointer space-y-1"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-medium">
                      {product.category_name}
                    </div>
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
    </div>
  );
};
