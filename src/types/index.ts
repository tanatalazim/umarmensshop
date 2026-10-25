export type UserRole = 'OWNER' | 'MANAGER' | 'WAREHOUSE' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: UserRole[];
  permissions: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  price: number;
  isAvailable: boolean;
  availableQuantity?: number;
}

export interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary: number;
}

export interface Product {
  id: string;
  slug: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  name: string;
  description: string;
  composition?: string;
  care_instructions?: string;
  base_price: number;
  discount_price?: number | null;
  primary_image?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  availableSizes?: string[];
  is_demo: number;
  similarProducts?: Product[];
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface OrderItem {
  id: string;
  variant_id: string;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  tracking_token: string;
  status: 'new' | 'awaiting_payment' | 'paid' | 'processing' | 'ready_for_pickup' | 'shipped' | 'completed' | 'cancelled' | 'returned';
  delivery_type: 'courier_almaty' | 'pickup';
  delivery_address?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  customer_comment?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  payment?: {
    status: string;
    provider: string;
    qr_payload?: string;
    payment_url?: string;
  };
}

export interface InventoryItem {
  variant_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  min_threshold: number;
  updated_at: string;
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  product_id: string;
  product_name: string;
  base_price: number;
  discount_price?: number;
  warehouse_name: string;
}

export interface InventoryMovement {
  id: string;
  variant_id: string;
  warehouse_id: string;
  change_amount: number;
  movement_type: string;
  reference_order_id?: string;
  performed_by_user_id?: string;
  reason?: string;
  created_at: string;
  sku?: string;
  size?: string;
  product_name?: string;
  user_name?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}
