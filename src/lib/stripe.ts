import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Get or create Stripe instance
 * @returns Stripe instance
 */
export const getStripe = (): Stripe => {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripe;
};

/**
 * Create or find a Stripe customer
 * @param email - Customer email
 * @returns Promise<Stripe.Customer>
 */
export async function createOrFindCustomer(email: string): Promise<Stripe.Customer> {
  const stripe = getStripe();
  
  // First, try to find existing customer
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // If no existing customer, create a new one
  return await stripe.customers.create({
    email: email,
  });
}

/**
 * Create a payment intent with order details
 * @param amount - Amount in cents
 * @param orderDetails - Order information
 * @returns Promise<Stripe.PaymentIntent>
 */
export async function createPaymentIntent(
  amount: number,
  orderDetails: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    customerInfo: {
      name: string;
      email: string;
      address: string;
      city: string;
      zipCode: string;
    };
    deliveryDate: string;
    comments?: string;
  }
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  // Create or find customer
  const customer = await createOrFindCustomer(orderDetails.customerInfo.email);

  return await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderType:'online',
      items: JSON.stringify(orderDetails.items),
      customerName: orderDetails.customerInfo.name,
      customerEmail: orderDetails.customerInfo.email,
      deliveryAddress: `${orderDetails.customerInfo.address}, ${orderDetails.customerInfo.city}, ${orderDetails.customerInfo.zipCode}`,
      deliveryDate: orderDetails.deliveryDate,
      comments: orderDetails.comments || '',
    },
    description: orderDetails.comments || `${orderDetails.items.length} item(s) - ${orderDetails.customerInfo.name}`,
  });
} 