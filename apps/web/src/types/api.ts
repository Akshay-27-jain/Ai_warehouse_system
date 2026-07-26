export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  total?: number;
  pages?: number;
  page?: number;
  per_page?: number;
  items?: T[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: string[];
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  description: string;
  category_id: number;
  supplier_id?: number;
  unit_cost: string;
  selling_price: string;
  is_active: boolean;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  warehouse_id: number;
  sku: string;
  barcode?: string;
  name: string;
  available_quantity: number;
  reserved_quantity: number;
  reorder_point: number;
  low_stock_threshold: number;
  last_adjusted_at?: string;
}

export interface Order {
  id: number;
  order_number: string;
  warehouse_id: number;
  user_id: number;
  status: string;
  order_date: string;
  expected_delivery_date?: string;
  delivered_at?: string;
  delivery_status?: string;
  payment_status?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
}
