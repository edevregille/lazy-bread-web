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

// Subscription interface
export interface Subscription {
  id: string;
  status: 'active' | 'paused' | 'cancelled';
  current_period_start: Date;
  current_period_end: Date;
  items: Array<{
    id: string;
    quantity: number;
    price: {
      id: string;
      unit_amount: number;
      currency: string;
    };
  }>;
  metadata?: Record<string, string>;
  created: Date;
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