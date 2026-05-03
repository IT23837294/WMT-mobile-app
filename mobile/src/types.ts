export type UserRole = 'customer' | 'pharmacist' | 'admin' | 'support_officer' | 'supplier';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  avatar?: string;
};

export type AuthResult = {
  success: boolean;
  token: string;
  user: User;
};

export type Medicine = {
  _id: string;
  name: string;
  category?: string;
  subCategory?: string;
  description?: string;
  price?: number;
  sellingPrice?: number;
  image?: string;
  manufacturer?: string;
  supplier?: { name?: string };
  requiresPrescription?: boolean;
  dosage?: string;
  strength?: string;
  thresholdValue?: number;
  totalStock?: number;
  stockQuantity?: number;
  nearestExpiry?: string | null;
  stockStatus?: string;
  isActive?: boolean;
};

export type CartItem = {
  _id: string;
  medicine: Medicine;
  quantity: number;
  price: number;
  availableStock?: number;
  itemTotal?: number;
  isAvailable?: boolean;
};

export type Cart = {
  _id: string;
  items: CartItem[];
  totalAmount?: number;
};

export type OrderItem = {
  medicine: Medicine;
  quantity: number;
  price: number;
};

export type Order = {
  _id: string;
  orderNumber?: string;
  orderStatus?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  paymentMethod?: string;
  totalAmount?: number;
  finalAmount?: number;
  deliveryCharge?: number;
  trackingNumber?: string;
  createdAt?: string;
  items: OrderItem[];
  deliveryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
};
