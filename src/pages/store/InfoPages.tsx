import React from 'react';
import { Truck, RefreshCw, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

interface InfoPageProps {
  type: 'delivery' | 'returns' | 'contacts' | 'about' | 'privacy' | 'terms';
  onNavigate: (path: string) => void;
}

export const InfoPages: React.FC<InfoPageProps> = ({ type, onNavigate }) => {
  if (type === 'delivery') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold block mb-1">Клиентский сервис</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Доставка и оплата</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-white border border-zinc-200 space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm uppercase tracking-wider">
              <Truck className="w-5 h-5" />
              Курьерская доставка по Алматы
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Доставка осуществляется собственной курьерской службой бутика в день заказа или на следующий день.
            </p>
            <ul className="text-xs text-zinc-600 space-y-1 list-disc list-inside">
              <li>При заказе от 100 000 ₸ — <strong>Бесплатно</strong></li>
              <li>При заказе до 100 000 ₸ — <strong>2 500 ₸</strong></li>
              <li>Возможность заказать до 3 смежных размеров на примерку (до 15 минут)</li>
            </ul>
          </div>

          <div className="p-6 bg-white border border-zinc-200 space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm uppercase tracking-wider">
              <MapPin className="w-5 h-5" />
              Самовывоз из бутика
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Вы можете забрать заказ и примерить одежду в нашем фирменном бутике:
            </p>
            <p className="text-xs font-semibold text-zinc-900">
              г. Алматы, пр. Достык, 128 (угол ул. Сатпаева)
            </p>
            <p className="text-xs text-zinc-500">
              Ежедневно с 10:00 до 21:00. Примерка и подгонка брюк на месте.
            </p>
          </div>
        </div>

        <div className="p-6 bg-zinc-900 text-white space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            Безопасная оплата через Kaspi Pay & QR
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Мы поддерживаем оплату через официальное приложение Kaspi.kz по прямому QR-коду без комиссий. Также доступна оплата картами Visa и Mastercard любого банка Казахстана.
          </p>
        </div>
      </div>
    );
  }

  if (type === 'returns') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold block mb-1">Клиентский сервис</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Примерка и возврат</h1>
        </div>

        <div className="p-6 bg-white border border-zinc-200 space-y-4 text-xs text-zinc-600 leading-relaxed">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Правила возврата изделий:</h2>
          <p>
            Согласно Закону Республики Казахстан «О защите прав потребителей», вы имеете право обменять или вернуть товар надлежащего качества в течение <strong>14 календарных дней</strong> с момента покупки.
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Товар не был в употреблении, сохранены его товарный вид, потребительские свойства, оригинальные бирки и фабричные пломбы.</li>
            <li>Имеется чек или электронное подтверждение заказа UMAR MENS SHOP.</li>
            <li>Возврат осуществляется в бутике UMAR MENS (пр. Достык, 128) либо через вызов курьера.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (type === 'contacts') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold block mb-1">Бутик в Алматы</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Контакты и адрес</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-zinc-200 space-y-2 text-xs">
            <MapPin className="w-6 h-6 text-zinc-800" />
            <h3 className="font-bold text-zinc-900 uppercase">Адрес бутика</h3>
            <p className="text-zinc-600">г. Алматы, пр. Достык, 128</p>
            <p className="text-zinc-500">Угол ул. Сатпаева, удобная парковка для гостей</p>
          </div>

          <div className="p-6 bg-white border border-zinc-200 space-y-2 text-xs">
            <Phone className="w-6 h-6 text-zinc-800" />
            <h3 className="font-bold text-zinc-900 uppercase">Телефоны</h3>
            <p className="font-mono font-medium text-zinc-900">+7 (727) 355-12-80</p>
            <p className="font-mono text-zinc-600">+7 (777) 100-20-00 (WhatsApp)</p>
          </div>

          <div className="p-6 bg-white border border-zinc-200 space-y-2 text-xs">
            <Clock className="w-6 h-6 text-zinc-800" />
            <h3 className="font-bold text-zinc-900 uppercase">Часы работы</h3>
            <p className="text-zinc-900 font-medium">Ежедневно: 10:00 – 21:00</p>
            <p className="text-zinc-500">Без перерывов и выходных</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
        {type === 'about' ? 'О бренде UMAR MENS SHOP' : 'Правовая информация'}
      </h1>
      <div className="p-8 bg-white border border-zinc-200 text-xs text-zinc-600 leading-relaxed space-y-4">
        <p>
          UMAR MENS SHOP — флагманский магазин мужской классической и smart-casual одежды в Алматы. Мы уделяем ключевое внимание натуральным тканям, анатомическому крою и защите персональных данных каждого покупателя.
        </p>
      </div>
    </div>
  );
};
