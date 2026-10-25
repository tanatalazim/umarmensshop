import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Shield, Truck, RefreshCw, ShoppingBag, Heart, Ruler, X, ZoomIn } from 'lucide-react';
import type { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { ImageWithFallback } from '../../components/ImageWithFallback';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onNavigate }) => {
  const { addToCart, openCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/catalog/products/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Товар не найден');
        return res.json();
      })
      .then(data => {
        const prod = data.product;
        setProduct(prod);
        if (prod.images && prod.images.length > 0) {
          setSelectedImage(prod.images[0].image_url);
        } else if (prod.primary_image) {
          setSelectedImage(prod.primary_image);
        }
        if (prod.variants && prod.variants.length > 0) {
          const firstAvailable = prod.variants.find((v: ProductVariant) => v.isAvailable) || prod.variants[0];
          setSelectedVariant(firstAvailable);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant || !selectedVariant.isAvailable) return;

    addToCart({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      sku: selectedVariant.sku,
      size: selectedVariant.size,
      color: selectedVariant.color,
      price: selectedVariant.price,
      imageUrl: selectedImage || product.primary_image || ''
    }, quantity);

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-zinc-900 border border-zinc-800" />
            <div className="space-y-6">
              <div className="h-8 bg-zinc-900 w-3/4" />
              <div className="h-6 bg-zinc-900 w-1/4" />
              <div className="h-24 bg-zinc-900" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-black min-h-screen py-20 text-center text-white">
        <h2 className="text-xl font-bold uppercase tracking-tight">Изделие не найдено</h2>
        <p className="text-xs text-zinc-500 mt-2">Возможно, позиция снята с витрины или ссылка устарела</p>
        <button
          onClick={() => onNavigate('/catalog')}
          className="mt-6 px-6 py-2.5 bg-white text-black text-xs uppercase tracking-wider font-bold"
        >
          Вернуться в каталог
        </button>
      </div>
    );
  }

  const activePrice = selectedVariant?.price || product.discount_price || product.base_price;
  const favorite = isFavorite(product.id);

  return (
    <div className="bg-black text-white min-h-screen py-6 sm:py-10 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <button
            onClick={() => onNavigate('/catalog')}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white uppercase tracking-wider font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к каталогу
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(product)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${favorite ? 'fill-white text-white' : 'text-zinc-500'}`} />
            <span>{favorite ? 'В избранном' : 'В избранное'}</span>
          </button>
        </div>

        {/* Main Contiguous Purchase Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Left: Gallery (Thumbnails + Main Stage) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {product.images && product.images.length > 1 && (
              <div className="flex md:flex-col gap-3 shrink-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                {product.images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`w-16 h-22 border shrink-0 overflow-hidden transition-all ${
                      selectedImage === img.image_url ? 'border-white ring-1 ring-white' : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback
                      src={img.image_url}
                      alt={product.name}
                      aspectRatio="aspect-[3/4]"
                      categoryName="UMAR"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 aspect-[3/4] bg-zinc-950 border border-zinc-800 overflow-hidden relative group">
              <ImageWithFallback
                src={selectedImage || product.primary_image}
                alt={product.name}
                aspectRatio="aspect-[3/4]"
                categoryName={product.category_name}
              />

              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-3 right-3 p-2 bg-black/80 text-zinc-300 hover:text-white border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Увеличить фото"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-1">
                {product.category_name} · UMAR MENS
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight">
                {product.name}
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Артикул: {selectedVariant?.sku || 'UMAR-SKU'}
              </p>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-4 pt-2 border-t border-zinc-900">
              <span className="text-2xl sm:text-4xl font-bold font-mono text-white">
                {activePrice.toLocaleString('ru-RU')} ₸
              </span>
              {product.discount_price && product.discount_price < product.base_price && (
                <span className="text-base font-mono text-zinc-500 line-through">
                  {product.base_price.toLocaleString('ru-RU')} ₸
                </span>
              )}
            </div>

            {/* Size Selector */}
            <div className="space-y-3 pt-3 border-t border-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Выберите размер:
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 underline underline-offset-4"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Таблица размеров
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {product.variants?.map(variant => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isAvailable = variant.isAvailable;

                  return (
                    <button
                      key={variant.id}
                      disabled={!isAvailable}
                      onClick={() => setSelectedVariant(variant)}
                      className={`py-3 px-2 text-xs font-mono font-medium border transition-all text-center ${
                        isSelected
                          ? 'border-white bg-white text-black font-bold'
                          : isAvailable
                          ? 'border-zinc-800 text-zinc-300 hover:border-zinc-600 bg-zinc-950'
                          : 'border-zinc-900 text-zinc-600 bg-zinc-950 cursor-not-allowed line-through'
                      }`}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>

              {/* Availability */}
              <div className="text-xs pt-1 flex items-center gap-2 font-mono">
                {selectedVariant?.isAvailable ? (
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    В наличии на складе в Алматы (доступна примерка)
                  </div>
                ) : (
                  <div className="text-zinc-600">
                    Выбранный размер временно распродан
                  </div>
                )}
              </div>
            </div>

            {/* Quantity & Add to Cart Action */}
            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <div className="flex gap-3">
                <div className="flex items-center border border-zinc-800 bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-3 text-sm text-zinc-400 hover:text-white"
                    aria-label="Меньше"
                  >
                    -
                  </button>
                  <span className="px-3 py-3 text-xs font-mono font-bold min-w-8 text-center text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-3 text-sm text-zinc-400 hover:text-white"
                    aria-label="Больше"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!selectedVariant?.isAvailable}
                  onClick={handleAddToCart}
                  className={`flex-1 py-4 px-6 text-xs uppercase tracking-[0.2em] font-extrabold transition-all flex items-center justify-center gap-2 ${
                    selectedVariant?.isAvailable
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {selectedVariant?.isAvailable ? 'Добавить в корзину' : 'Нет в наличии'}
                </button>
              </div>

              {addedNotice && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 text-white text-xs flex items-center justify-between">
                  <span>Изделие добавлено в вашу корзину</span>
                  <button onClick={openCart} className="underline font-bold ml-2">
                    Открыть корзину →
                  </button>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="pt-6 border-t border-zinc-900 space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-white uppercase tracking-wider mb-2 font-mono">Описание изделия</h3>
                <p className="text-zinc-400 leading-relaxed">{product.description}</p>
              </div>

              {product.composition && (
                <div>
                  <h3 className="font-bold text-white uppercase tracking-wider mb-1 font-mono">Состав и материалы</h3>
                  <p className="text-zinc-400 font-mono">{product.composition}</p>
                </div>
              )}

              {product.care_instructions && (
                <div>
                  <h3 className="font-bold text-white uppercase tracking-wider mb-1 font-mono">Уход</h3>
                  <p className="text-zinc-400">{product.care_instructions}</p>
                </div>
              )}
            </div>

            {/* Service Guarantees */}
            <div className="pt-6 border-t border-zinc-900 grid grid-cols-2 gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-white shrink-0" />
                <span>Примерка по Алматы</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-white shrink-0" />
                <span>Оплата Kaspi Pay QR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {product.similarProducts && product.similarProducts.length > 0 && (
          <div className="pt-16 border-t border-zinc-900">
            <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white mb-6">
              Вам может подойти
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {product.similarProducts.map(sp => (
                <div
                  key={sp.id}
                  onClick={() => onNavigate(`/product/${sp.slug}`)}
                  className="group cursor-pointer bg-zinc-900 border border-zinc-800 p-3 hover:border-zinc-600 transition-all space-y-2"
                >
                  <div className="aspect-[3/4] bg-black overflow-hidden">
                    <ImageWithFallback
                      src={sp.primary_image}
                      alt={sp.name}
                      aspectRatio="aspect-[3/4]"
                      categoryName="UMAR"
                      className="group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-zinc-300">
                    {sp.name}
                  </h3>
                  <div className="font-mono text-xs font-bold text-white">
                    {sp.base_price.toLocaleString('ru-RU')} ₸
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Buy Bar */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-black/95 backdrop-blur-md border-t border-zinc-800 p-2.5 px-4 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-mono">
            {selectedVariant?.size ? `Размер: ${selectedVariant.size}` : 'Размер не выбран'}
          </span>
          <span className="text-sm font-bold font-mono text-white">
            {activePrice.toLocaleString('ru-RU')} ₸
          </span>
        </div>

        <button
          type="button"
          disabled={!selectedVariant?.isAvailable}
          onClick={handleAddToCart}
          className={`py-2.5 px-5 text-xs uppercase tracking-wider font-extrabold transition-all flex items-center gap-1.5 ${
            selectedVariant?.isAvailable
              ? 'bg-white text-black hover:bg-zinc-200'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {selectedVariant?.isAvailable ? 'В корзину' : 'Нет в наличии'}
        </button>
      </div>

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage || product.primary_image}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain border border-zinc-800"
          />
        </div>
      )}

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setIsSizeGuideOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-950 text-white border border-zinc-800 p-6 shadow-2xl z-10 space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-white">Таблица мужских размеров</h3>
                <p className="text-zinc-400 text-[11px] font-mono">Стандарты бутика UMAR MENS (Алматы / Италия)</p>
              </div>
              <button onClick={() => setIsSizeGuideOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-2 font-mono">Костюмы и пальто (RU / IT)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-zinc-800 font-mono text-[11px]">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-300">
                      <tr>
                        <th className="p-2">Размер</th>
                        <th className="p-2">Обхват груди</th>
                        <th className="p-2">Обхват талии</th>
                        <th className="p-2">Рост</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      <tr><td className="p-2 font-bold text-white">48 (M)</td><td className="p-2">94–98 см</td><td className="p-2">82–86 см</td><td className="p-2">176–182 см</td></tr>
                      <tr><td className="p-2 font-bold text-white">50 (L)</td><td className="p-2">98–102 см</td><td className="p-2">86–90 см</td><td className="p-2">178–184 см</td></tr>
                      <tr><td className="p-2 font-bold text-white">52 (XL)</td><td className="p-2">102–106 см</td><td className="p-2">90–94 см</td><td className="p-2">180–186 см</td></tr>
                      <tr><td className="p-2 font-bold text-white">54 (XXL)</td><td className="p-2">106–110 см</td><td className="p-2">94–98 см</td><td className="p-2">182–188 см</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-2 font-mono">Сорочки (по вороту)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-zinc-800 font-mono text-[11px]">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-300">
                      <tr>
                        <th className="p-2">Ворот</th>
                        <th className="p-2">Международный</th>
                        <th className="p-2">Обхват груди</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      <tr><td className="p-2 font-bold text-white">39 см</td><td className="p-2">S</td><td className="p-2">92–96 см</td></tr>
                      <tr><td className="p-2 font-bold text-white">40 см</td><td className="p-2">M</td><td className="p-2">96–100 см</td></tr>
                      <tr><td className="p-2 font-bold text-white">41 см</td><td className="p-2">L</td><td className="p-2">100–104 см</td></tr>
                      <tr><td className="p-2 font-bold text-white">42 см</td><td className="p-2">XL</td><td className="p-2">104–108 см</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 font-mono italic">
              При курьерской доставке по Алматы доступна бесплатная примерка смежных размеров.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
