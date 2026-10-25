import crypto from 'node:crypto';
import { db, initDatabase } from './db.js';
import { hashPassword } from './auth.js';

export function runBootstrap() {
  initDatabase();

  // 1. Roles & Permissions
  const roles = [
    { id: 'OWNER', name: 'Владелец бизнеса', description: 'Полный доступ ко всем модулям, финансам и настройкам' },
    { id: 'MANAGER', name: 'Менеджер по продажам', description: 'Обработка заказов, клиентские коммуникации' },
    { id: 'WAREHOUSE', name: 'Сотрудник склада', description: 'Приемка, комплектация, перемещения, инвентаризация' },
    { id: 'CUSTOMER', name: 'Покупатель', description: 'Покупка товаров, личный кабинет, свои заказы' }
  ];

  for (const role of roles) {
    db.prepare(`
      INSERT INTO roles (id, name, description)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description
    `).run(role.id, role.name, role.description);
  }

  const permissions = [
    { id: 'products:create', description: 'Создание товаров' },
    { id: 'products:update', description: 'Редактирование описаний товаров' },
    { id: 'pricing:update', description: 'Изменение цен и скидок' },
    { id: 'orders:read_all', description: 'Просмотр всех заказов магазина' },
    { id: 'orders:update_status', description: 'Смена статусов заказов' },
    { id: 'orders:fulfill', description: 'Сборка и выдача заказов' },
    { id: 'inventory:read', description: 'Просмотр складских остатков' },
    { id: 'inventory:receive', description: 'Приемка товара на склад' },
    { id: 'inventory:adjust', description: 'Корректировка и списание остатков' },
    { id: 'inventory:move', description: 'Перемещение товара между складами' },
    { id: 'analytics:read', description: 'Просмотр аналитики продаж' },
    { id: 'finances:read', description: 'Просмотр финансовых отчетов и маржи' },
    { id: 'employees:manage', description: 'Управление сотрудниками' },
    { id: 'roles:manage', description: 'Управление правами доступа' },
    { id: 'settings:manage', description: 'Глобальные настройки магазина' },
    { id: 'integrations:manage', description: 'Настройка интеграций (Kaspi, TG)' },
    { id: 'audit:read', description: 'Просмотр журнала аудита' },
    { id: 'customers:read_operational', description: 'Доступ к контактам для доставки' },
    { id: 'conversations:manage', description: 'Общение с клиентами в CRM' },
    { id: 'orders:create', description: 'Оформление заказа' },
    { id: 'orders:read_own', description: 'Просмотр собственного заказа' },
    { id: 'profile:manage', description: 'Управление своим профилем' }
  ];

  for (const perm of permissions) {
    db.prepare(`
      INSERT INTO permissions (id, description)
      VALUES (?, ?)
      ON CONFLICT(id) DO NOTHING
    `).run(perm.id, perm.description);
  }

  // Assign permissions to roles
  const rolePermMap: Record<string, string[]> = {
    OWNER: permissions.map(p => p.id), // Owner has all permissions
    MANAGER: [
      'orders:read_all',
      'orders:update_status',
      'inventory:read',
      'customers:read_operational',
      'conversations:manage',
      'orders:create',
      'orders:read_own',
      'profile:manage'
    ],
    WAREHOUSE: [
      'inventory:read',
      'inventory:receive',
      'inventory:adjust',
      'inventory:move',
      'orders:fulfill',
      'orders:read_own',
      'profile:manage'
    ],
    CUSTOMER: [
      'orders:create',
      'orders:read_own',
      'profile:manage'
    ]
  };

  for (const [roleId, permIds] of Object.entries(rolePermMap)) {
    for (const permId of permIds) {
      db.prepare(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
        ON CONFLICT(role_id, permission_id) DO NOTHING
      `).run(roleId, permId);
    }
  }

  // 2. Default Warehouse
  const warehouseId = 'wh_almaty_main';
  db.prepare(`
    INSERT INTO warehouses (id, name, city, address, is_active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(id) DO NOTHING
  `).run(warehouseId, 'Основной склад UMAR MENS (Алматы)', 'Алматы', 'пр. Достык, 128 / ул. Сатпаева');

  // 3. Seed Users (with secure unique hashes)
  const defaultPassword = 'UmarShop2026!Secure';
  const hashedPw = hashPassword(defaultPassword);

  const initialUsers = [
    {
      id: 'usr_owner_01',
      email: 'owner@umarmens.kz',
      fullName: 'Умар Сериков (Владелец)',
      phone: '+7 (777) 100-20-01',
      role: 'OWNER'
    },
    {
      id: 'usr_manager_01',
      email: 'manager@umarmens.kz',
      fullName: 'Данияр Ахметов (Менеджер)',
      phone: '+7 (777) 100-20-02',
      role: 'MANAGER'
    },
    {
      id: 'usr_warehouse_01',
      email: 'warehouse@umarmens.kz',
      fullName: 'Ернар Кусаинов (Склад)',
      phone: '+7 (777) 100-20-03',
      role: 'WAREHOUSE'
    },
    {
      id: 'usr_customer_01',
      email: 'customer@gmail.com',
      fullName: 'Арман Бауыржанулы (Покупатель)',
      phone: '+7 (701) 987-65-43',
      role: 'CUSTOMER'
    }
  ];

  for (const u of initialUsers) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, phone)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(email) DO NOTHING
    `).run(u.id, u.email, hashedPw, u.fullName, u.phone);

    db.prepare(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (?, ?)
      ON CONFLICT(user_id, role_id) DO NOTHING
    `).run(u.id, u.role);

    // If customer, create customer record
    if (u.role === 'CUSTOMER') {
      db.prepare(`
        INSERT INTO customers (id, user_id, email, phone, full_name)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO NOTHING
      `).run('cust_01', u.id, u.email, u.phone, u.fullName);

      db.prepare(`
        INSERT INTO customer_addresses (id, customer_id, city, street, apartment, is_default)
        VALUES (?, ?, ?, ?, ?, 1)
        ON CONFLICT(id) DO NOTHING
      `).run('addr_01', 'cust_01', 'Алматы', 'ул. Абая, 52', 'кв. 14');
    }
  }

  // 4. Categories
  const categories = [
    { id: 'cat_suits', slug: 'suits', name: 'Костюмы', display_order: 1 },
    { id: 'cat_coats', slug: 'coats', name: 'Верхняя одежда', display_order: 2 },
    { id: 'cat_shirts', slug: 'shirts', name: 'Рубашки', display_order: 3 },
    { id: 'cat_knitwear', slug: 'knitwear', name: 'Трикотаж & Поло', display_order: 4 },
    { id: 'cat_trousers', slug: 'trousers', name: 'Брюки', display_order: 5 },
    { id: 'cat_shoes', slug: 'shoes', name: 'Обувь', display_order: 6 }
  ];

  for (const c of categories) {
    db.prepare(`
      INSERT INTO categories (id, slug, name, display_order)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, slug = excluded.slug
    `).run(c.id, c.slug, c.name, c.display_order);
  }

  // 5. Seed Catalog with realistic photos, multiple angles and sizes
  const products = [
    {
      id: 'prod_suit_charcoal',
      slug: 'kostyum-charcoal-wool',
      category_id: 'cat_suits',
      name: 'Костюм-двойка шерстяной Charcoal Super 130s',
      description: 'Безупречный мужской костюм итальянского кроя из 100% шерсти Super 130s. Идеальная посадка по фигуре, пиджак на полуподкладке и брюки со средней посадкой.',
      composition: '100% шерсть Super 130s (Biella, Italy), подкладка 100% купро',
      care_instructions: 'Исключительно сухая химчистка. Хранить на широких плечиках.',
      base_price: 189900,
      discount_price: 169900,
      images: [
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1000'
      ],
      variants: [
        { size: '48 (M)', color: 'Графитовый', color_hex: '#2B2D2F', sku: 'UMAR-ST-CH-48', stock: 4 },
        { size: '50 (L)', color: 'Графитовый', color_hex: '#2B2D2F', sku: 'UMAR-ST-CH-50', stock: 6 },
        { size: '52 (XL)', color: 'Графитовый', color_hex: '#2B2D2F', sku: 'UMAR-ST-CH-52', stock: 3 },
        { size: '54 (XXL)', color: 'Графитовый', color_hex: '#2B2D2F', sku: 'UMAR-ST-CH-54', stock: 1 }
      ]
    },
    {
      id: 'prod_coat_cashmere',
      slug: 'palto-cashmere-black',
      category_id: 'cat_coats',
      name: 'Пальто двубортное кашемировое Black',
      description: 'Классическое удлиненное мужское пальто из плотного бленда кашемира и альпаки. Роговые пуговицы, шлица сзади, ветрозащитный воротник.',
      composition: '70% шерсть, 25% кашемир, 5% альпака',
      care_instructions: 'Деликатная сухая чистка.',
      base_price: 245000,
      discount_price: null,
      images: [
        'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1000'
      ],
      variants: [
        { size: '48 (M)', color: 'Глубокий чёрный', color_hex: '#0A0A0A', sku: 'UMAR-CT-BK-48', stock: 3 },
        { size: '50 (L)', color: 'Глубокий чёрный', color_hex: '#0A0A0A', sku: 'UMAR-CT-BK-50', stock: 5 },
        { size: '52 (XL)', color: 'Глубокий чёрный', color_hex: '#0A0A0A', sku: 'UMAR-CT-BK-52', stock: 2 }
      ]
    },
    {
      id: 'prod_shirt_egyptian',
      slug: 'rubashka-egyptian-cotton-white',
      category_id: 'cat_shirts',
      name: 'Рубашка Regular Fit из египетского хлопка White',
      description: 'Флагманская белая сорочка с французским воротником. Плотное саржевое плетение, перламутровые пуговицы, легкая глажка Easy Care.',
      composition: '100% египетский длинноволокнистый хлопок (Giza 87)',
      care_instructions: 'Стирка при 40°C, глажка с паром.',
      base_price: 49900,
      discount_price: 39900,
      images: [
        'https://images.unsplash.com/photo-1620012253295-c15c429fbb41?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1000'
      ],
      variants: [
        { size: '39 (S)', color: 'Белоснежный', color_hex: '#FFFFFF', sku: 'UMAR-SH-WH-39', stock: 8 },
        { size: '40 (M)', color: 'Белоснежный', color_hex: '#FFFFFF', sku: 'UMAR-SH-WH-40', stock: 12 },
        { size: '41 (L)', color: 'Белоснежный', color_hex: '#FFFFFF', sku: 'UMAR-SH-WH-41', stock: 10 },
        { size: '42 (XL)', color: 'Белоснежный', color_hex: '#FFFFFF', sku: 'UMAR-SH-WH-42', stock: 6 }
      ]
    },
    {
      id: 'prod_polo_knit',
      slug: 'polo-merino-knit-navy',
      category_id: 'cat_knitwear',
      name: 'Поло вязаное из мериносовой шерсти Navy',
      description: 'Smart casual вязаное поло с воротником-стойкой без пуговиц. Тонкая пряжа мериноса обеспечивает комфортную терморегуляцию в течение всего дня.',
      composition: '100% экстратонкая мериносовая шерсть',
      care_instructions: 'Ручная стирка в холодной воде или деликатный режим «Шерсть».',
      base_price: 59900,
      discount_price: null,
      images: [
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=1000'
      ],
      variants: [
        { size: 'S', color: 'Темно-синий', color_hex: '#1B263B', sku: 'UMAR-PL-NV-S', stock: 5 },
        { size: 'M', color: 'Темно-синий', color_hex: '#1B263B', sku: 'UMAR-PL-NV-M', stock: 7 },
        { size: 'L', color: 'Темно-синий', color_hex: '#1B263B', sku: 'UMAR-PL-NV-L', stock: 8 },
        { size: 'XL', color: 'Темно-синий', color_hex: '#1B263B', sku: 'UMAR-PL-NV-XL', stock: 4 }
      ]
    },
    {
      id: 'prod_trousers_grey',
      slug: 'bryuki-flannel-grey',
      category_id: 'cat_trousers',
      name: 'Брюки фланелевые со стрелками Grey',
      description: 'Элегантные классические брюки из итальянской шерстяной фланели. Зауженный силуэт, боковые регуляторы на талии вместо шлевок под ремень.',
      composition: '98% шерсть, 2% эластан',
      care_instructions: 'Сухая чистка.',
      base_price: 79900,
      discount_price: null,
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=1000'
      ],
      variants: [
        { size: '48 (M)', color: 'Серый меланж', color_hex: '#6C757D', sku: 'UMAR-TR-GR-48', stock: 6 },
        { size: '50 (L)', color: 'Серый меланж', color_hex: '#6C757D', sku: 'UMAR-TR-GR-50', stock: 8 },
        { size: '52 (XL)', color: 'Серый меланж', color_hex: '#6C757D', sku: 'UMAR-TR-GR-52', stock: 5 }
      ]
    },
    {
      id: 'prod_shoes_loafers',
      slug: 'loafery-leather-black',
      category_id: 'cat_shoes',
      name: 'Лоферы пенни из телячьей кожи Black',
      description: 'Классические пенни-лоферы конструкции Goodyear Welted. Ручная полировка воском, кожаная подошва с профилактикой.',
      composition: '100% натуральная кожа теленка Box Calf',
      care_instructions: 'Использовать формодержатели из кедра, очищать кремом для обуви.',
      base_price: 139000,
      discount_price: 119000,
      images: [
        'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1000'
      ],
      variants: [
        { size: '41 EU', color: 'Чёрный', color_hex: '#111111', sku: 'UMAR-SH-BK-41', stock: 2 },
        { size: '42 EU', color: 'Чёрный', color_hex: '#111111', sku: 'UMAR-SH-BK-42', stock: 4 },
        { size: '43 EU', color: 'Чёрный', color_hex: '#111111', sku: 'UMAR-SH-BK-43', stock: 3 },
        { size: '44 EU', color: 'Чёрный', color_hex: '#111111', sku: 'UMAR-SH-BK-44', stock: 1 }
      ]
    }
  ];

  for (const p of products) {
    db.prepare(`
      INSERT INTO products (id, slug, category_id, name, description, composition, care_instructions, base_price, discount_price, is_active, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        base_price = excluded.base_price,
        discount_price = excluded.discount_price,
        description = excluded.description
    `).run(p.id, p.slug, p.category_id, p.name, p.description, p.composition, p.care_instructions, p.base_price, p.discount_price);

    // Product Images
    for (let i = 0; i < p.images.length; i++) {
      const imgUrl = p.images[i];
      db.prepare(`
        INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET image_url = excluded.image_url
      `).run(`img_${p.id}_${i}`, p.id, imgUrl, `${p.name} - ракурс ${i + 1}`, i === 0 ? 1 : 0, i);
    }

    // Variants and Inventory
    for (const v of p.variants) {
      const variantId = `var_${v.sku.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      db.prepare(`
        INSERT INTO product_variants (id, product_id, sku, size, color, color_hex)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(sku) DO NOTHING
      `).run(variantId, p.id, v.sku, v.size, v.color, v.color_hex);

      db.prepare(`
        INSERT INTO inventory (variant_id, warehouse_id, quantity, reserved_quantity, min_threshold)
        VALUES (?, ?, ?, 0, 2)
        ON CONFLICT(variant_id, warehouse_id) DO UPDATE SET quantity = excluded.quantity
      `).run(variantId, warehouseId, v.stock);
    }
  }

  // 6. Seed Demo Orders for realistic Analytics & Staff management
  const demoOrdersCount = (db.prepare('SELECT count(*) as cnt FROM orders').get() as any).cnt;
  if (demoOrdersCount === 0) {
    const seedOrder = {
      id: 'ord_demo_101',
      orderNumber: 'UM-1042',
      customerId: 'cust_01',
      trackingToken: 'tok_demo_secure_48a91c',
      status: 'paid',
      customerName: 'Арман Бауыржанулы',
      customerPhone: '+7 (701) 987-65-43',
      deliveryAddress: 'г. Алматы, ул. Абая 52, кв. 14',
      subtotal: 169900,
      totalAmount: 169900,
      paymentStatus: 'succeeded'
    };

    db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_id, tracking_token, status, delivery_type,
        delivery_address, customer_name, customer_phone, subtotal, total_amount,
        payment_method, payment_status, source
      ) VALUES (?, ?, ?, ?, ?, 'courier_almaty', ?, ?, ?, ?, ?, 'kaspi_pay', ?, 'web')
    `).run(
      seedOrder.id,
      seedOrder.orderNumber,
      seedOrder.customerId,
      seedOrder.trackingToken,
      seedOrder.status,
      seedOrder.deliveryAddress,
      seedOrder.customerName,
      seedOrder.customerPhone,
      seedOrder.subtotal,
      seedOrder.totalAmount,
      seedOrder.paymentStatus
    );

    db.prepare(`
      INSERT INTO order_items (
        id, order_id, variant_id, product_name, sku, size, color, unit_price, quantity, total_price
      ) VALUES (?, ?, 'var_umar_st_ch_50', 'Костюм-двойка шерстяной Charcoal [DEMO]', 'UMAR-ST-CH-50', '50 (L)', 'Графитовый', 169900, 1, 169900)
    `).run(crypto.randomUUID(), seedOrder.id);
  }

  // 7. Store Settings
  const settings = [
    { key: 'STORE_NAME', value: 'UMAR MENS SHOP' },
    { key: 'STORE_CITY', value: 'Алматы' },
    { key: 'STORE_CURRENCY', value: 'KZT' },
    { key: 'KASPI_PAY_MODE', value: 'SANDBOX' },
    { key: 'TELEGRAM_BOT_TOKEN', value: '8975817013:AAHkxABzw1YUJRaXyt2ZJiDOfuQ2wQbH0L8' },
    { key: 'TELEGRAM_BOT_USERNAME', value: 'UMARSHOP223_Bot' },
    { key: 'TELEGRAM_BOT_STATUS', value: 'CONNECTED' }
  ];

  for (const s of settings) {
    db.prepare(`
      INSERT INTO store_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).run(s.key, s.value);
  }

  console.log('✅ UMAR MENS SHOP Database initialized and seeded successfully.');
}
