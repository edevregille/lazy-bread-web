// Order-related interfaces
export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderDetails {
  /** Omitted in some checkout payloads that only send orderItems */
  breadQuantities?: Record<string, number>;
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
  /** Defaults to delivery when omitted (legacy orders). */
  fulfillmentType?: FulfillmentType;
  /** Full display line for pickup location when fulfillmentType is pickup. */
  pickupLocation?: string;
}

// Payment-related interfaces
export interface PaymentSuccessData {
  orderDetails: OrderDetails;
  paymentIntentId?: string;
  setupIntentId?: string;
  timestamp: string;
  status: 'payment_completed' | 'setup_completed';
}

// Payment flow types
export type PaymentFlow =
  | 'loading'
  | 'guest-setup-intent'
  | 'error';

export interface StripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  created: number;
  metadata: Record<string, string>;
}

// Business settings interface
export interface BusinessSettings {
  isHolidayMode: boolean;
  holidayMessage?: string;
  deliveryZones: Record<string, string[]>;
  availableDeliveryDays: string[];
} 