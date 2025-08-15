// Order-related interfaces
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderDetails {
  breadQuantities: Record<string, number>;
  deliveryDate: string;
  address: string;
  city: string;
  zipCode: string;
  customerName: string;
  email: string;
  phone: string;
  comments: string;
  orderItems: OrderItem[];
  totalAmount: number;
  isRecurring?: boolean;
}
// Firebase-specific Order interface (different from OrderDetails)
export interface Order {
  id: string;
  items: OrderItem[];
  orderType: 'online' | 'subscription' | 'in-person';
  deliveryDate: string;
  address: string;
  city: string;
  zipCode: string;
  customerName: string;
  email: string;
  phone: string;
  comments: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: Date;
  userId?: string;
  stripeCustomerId: string;
  stripePaymentIntentId: string;
  stripePaymentStatus: string;
}

// Payment-related interfaces
export interface PaymentSuccessData {
  orderDetails: OrderDetails;
  paymentIntentId?: string;
  setupIntentId?: string;
  isRecurring: boolean;
  timestamp: string;
  status: 'payment_completed' | 'setup_completed';
}

// Payment flow types
export type PaymentFlow = 
  | 'loading'
  | 'guest-payment-intent'
  | 'signed-in-payment-intent'
  | 'saved-method-payment-intent'
  | 'subscription-setup-intent'
  | 'subscription-setup-intent-saved-method'
  | 'error';

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  deliveryAddress?: string;
  deliveryZipCode?: string;
  stripeCustomerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Payment method interface
export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name?: string | null;
    email?: string | null;
  };
}

// Firebase-specific Subscription interface
export interface Subscription {
  address: string;
  city: string;
  comments?: string;
  id?: string;
  createdAt: Date;
  userId: string;
  customerName: string;
  zipCode: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  status: 'active' | 'paused' | 'cancelled';
  frequency?: 'weekly';
  email: string;
  phone: string;
  items: OrderItem[];
  totalAmount?: number;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  stripeSetupIntentId: string;
  updatedAt?: Date;
}

// Auth modal types
export type AuthModalMode = 'signin' | 'signup' | 'forgot-password';

// Business settings interface
export interface BusinessSettings {
  isHolidayMode: boolean;
  holidayMessage?: string;
  deliveryZones: Record<string, string[]>;
  availableDeliveryDays: string[];
} 