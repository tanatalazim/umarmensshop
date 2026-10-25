import { Router } from 'express';
import { db } from '../db.js';

export const catalogRouter = Router();

// Categories
catalogRouter.get('/categories', (req, res) => {
  const categories = db.prepare(`SELECT * FROM categories ORDER BY display_order ASC`).all();
  res.json({ categories });
});

// Products List
catalogRouter.get('/products', (req, res) => {
  const { category, search, size, sort } = req.query;

  let query = `
    SELECT 
      p.id, p.slug, p.category_id, p.name, p.base_price, p.discount_price, p.is_demo,
      c.name as category_name, c.slug as category_slug,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  const params: any[] = [];

  if (category) {
    query += ` AND c.slug = ?`;
    params.push(category);
  }

  if (search) {
    query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (size) {
    query += ` AND p.id IN (
      SELECT product_id FROM product_variants WHERE size = ?
    )`;
    params.push(size);
  }

  if (sort === 'price_asc') {
    query += ` ORDER BY COALESCE(p.discount_price, p.base_price) ASC`;
  } else if (sort === 'price_desc') {
    query += ` ORDER BY COALESCE(p.discount_price, p.base_price) DESC`;
  } else {
    query += ` ORDER BY p.created_at DESC`;
  }

  const products = db.prepare(query).all(...params) as any[];

  // Attach available sizes per product for quick shop filter
  const productIds = products.map(p => p.id);
  let variantsMap: Record<string, string[]> = {};
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const variantRows = db.prepare(`
      SELECT pv.product_id, pv.size, (i.quantity - i.reserved_quantity) as available
      FROM product_variants pv
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.product_id IN (${placeholders})
    `).all(...productIds) as any[];

    for (const v of variantRows) {
      if (v.available > 0) {
        if (!variantsMap[v.product_id]) variantsMap[v.product_id] = [];
        if (!variantsMap[v.product_id].includes(v.size)) {
          variantsMap[v.product_id].push(v.size);
        }
      }
    }
  }

  const enriched = products.map(p => ({
    ...p,
    availableSizes: variantsMap[p.id] || []
  }));

  res.json({ products: enriched });
});

// Single Product Details
catalogRouter.get('/products/:slug', (req, res) => {
  const { slug } = req.params;
  const product = db.prepare(`
    SELECT 
      p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `).get(slug) as any;

  if (!product) {
    return res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'Товар не найден' });
  }

  const images = db.prepare(`
    SELECT id, image_url, alt_text, is_primary 
    FROM product_images 
    WHERE product_id = ? 
    ORDER BY display_order ASC
  `).all(product.id);

  // Fetch variants with sanitized public availability (NO warehouse IDs, NO secret stock count)
  const variantRows = db.prepare(`
    SELECT 
      pv.id, pv.sku, pv.size, pv.color, pv.color_hex, pv.price_override,
      COALESCE(SUM(i.quantity - i.reserved_quantity), 0) as available_units
    FROM product_variants pv
    LEFT JOIN inventory i ON pv.id = i.variant_id
    WHERE pv.product_id = ?
    GROUP BY pv.id
  `).all(product.id) as any[];

  const variants = variantRows.map(v => ({
    id: v.id,
    sku: v.sku,
    size: v.size,
    color: v.color,
    color_hex: v.color_hex,
    price: v.price_override || product.discount_price || product.base_price,
    isAvailable: v.available_units > 0,
    availableQuantity: Math.max(0, v.available_units) // Only for max stepper limit in cart
  }));

  // Fetch similar products in same category
  const similarProducts = db.prepare(`
    SELECT p.id, p.slug, p.name, p.base_price, p.discount_price,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
    LIMIT 4
  `).all(product.category_id, product.id);

  res.json({
    product: {
      ...product,
      images,
      variants,
      similarProducts
    }
  });
});
