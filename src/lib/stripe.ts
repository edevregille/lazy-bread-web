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
 * @param name - Optional customer name
 * @param metadata - Optional metadata
 * @returns Promise<Stripe.Customer>
 */
export async function createOrFindCustomer(
  email: string, 
  name?: string, 
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  const stripe = getStripe();
  
  console.log('Looking for existing customer with email:', email);
  
  // First, try to find existing customer
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    console.log('Found existing customer:', customer.id);
    
    // Update customer with new information if provided
    if (name || metadata) {
      const updateData: Stripe.CustomerUpdateParams = {};
      if (name) updateData.name = name;
      if (metadata) updateData.metadata = metadata;
      
      const updatedCustomer = await stripe.customers.update(customer.id, updateData);
      console.log('Updated existing customer:', updatedCustomer.id);
      return updatedCustomer;
    }
    
    return customer;
  }

  // If no existing customer, create a new one
  console.log('Creating new customer for email:', email);
  const customerData: Stripe.CustomerCreateParams = {
    email,
    metadata: {
      source: 'lazy-bread-web',
      ...metadata,
    },
  };
  
  if (name) {
    customerData.name = name;
  }

  const newCustomer = await stripe.customers.create(customerData);
  console.log('Created new customer:', newCustomer.id);
  return newCustomer;
}

/**
 * Create a payment intent with order details
 * @param amount - Amount in cents
 * @param orderDetails - Order information
 * @param userId - Optional user ID for order linking
 * @param savePaymentMethod - Whether to save the payment method for future use
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
      phone?: string;
    };
    deliveryDate: string;
    comments?: string;
  },
  userId?: string,
  savePaymentMethod?: boolean
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  // Create or find customer
  const customer = await createOrFindCustomer(orderDetails.customerInfo.email);

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
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
      address: orderDetails.customerInfo.address,
      city: orderDetails.customerInfo.city,
      zipCode: orderDetails.customerInfo.zipCode,
      phone: orderDetails.customerInfo.phone || '',
      deliveryDate: orderDetails.deliveryDate,
      comments: orderDetails.comments || '',
      isRecurring: 'false', // Default to false for regular orders
      userId: userId || '', // Store user ID for order linking
      savePaymentMethod: savePaymentMethod ? 'true' : 'false',
    },
    description: orderDetails.comments || `${orderDetails.items.length} item(s) - ${orderDetails.customerInfo.name}`,
  };

  // Add setup_future_usage if saving payment method
  if (savePaymentMethod) {
    paymentIntentData.setup_future_usage = 'off_session';
  }

  return await stripe.paymentIntents.create(paymentIntentData);
}

/**
 * Create a payment intent with a saved payment method
 * @param amount - Amount in cents
 * @param customerId - Stripe customer ID
 * @param paymentMethodId - Saved payment method ID
 * @param orderDetails - Order information
 * @param userId - Optional user ID for order linking
 * @returns Promise<Stripe.PaymentIntent>
 */
export async function createPaymentIntentWithSavedMethod(
  amount: number,
  customerId: string,
  paymentMethodId: string,
  orderDetails: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    customerName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
    phone?: string;
    deliveryDate: string;
    comments?: string;
  },
  userId?: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount), // Ensure amount is in cents
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true, // Confirm the payment immediately
    off_session: true, // Since we're using a saved payment method
    metadata: {
      orderType: 'online',
      items: JSON.stringify(orderDetails.items),
      customerName: orderDetails.customerName,
      customerEmail: orderDetails.email,
      address: orderDetails.address,
      city: orderDetails.city,
      zipCode: orderDetails.zipCode,
      phone: orderDetails.phone || '',
      deliveryDate: orderDetails.deliveryDate,
      comments: orderDetails.comments || '',
      isRecurring: 'false',
      userId: userId || '',
      paymentMethodType: 'saved',
    },
    description: orderDetails.comments || `${orderDetails.items.length} item(s) - ${orderDetails.customerName}`,
  };

  return await stripe.paymentIntents.create(paymentIntentData);
}

/**
 * Create a recurring payment intent
 * @param amount - Amount in cents
 * @param customerId - Stripe customer ID
 * @param paymentMethodId - Payment method ID
 * @param orderDetails - Order information
 * @returns Promise<Stripe.PaymentIntent>
 */
export async function createRecurringPaymentIntent(
  amount: number,
  customerId: string,
  paymentMethodId: string,
  orderDetails: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    deliveryDate: string;
    address: string;
    city: string;
    zipCode: string;
    customerName: string;
    email: string;
    phone: string;
    comments?: string;
  }
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount),
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    off_session: true,
    metadata: {
      orderType: 'recurring',
      items: JSON.stringify(orderDetails.items),
      customerName: orderDetails.customerName,
      customerEmail: orderDetails.email,
      address: orderDetails.address,
      city: orderDetails.city,
      zipCode: orderDetails.zipCode,
      deliveryDate: orderDetails.deliveryDate,
      phone: orderDetails.phone,
      comments: orderDetails.comments || '',
      isRecurring: 'true',
    },
    description: `Recurring order - ${orderDetails.items.length} item(s) - ${orderDetails.customerName}`,
  };

  return await stripe.paymentIntents.create(paymentIntentData);
}

/**
 * Get a Stripe customer by ID
 * @param customerId - Stripe customer ID
 * @returns Promise<Stripe.Customer>
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  const stripe = getStripe();
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
}

/**
 * Get payment methods for a customer
 * @param customerId - Stripe customer ID
 * @returns Promise<Stripe.PaymentMethod[]>
 */
export async function getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripe();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return paymentMethods.data;
}

/**
 * Create a setup intent for saving payment methods
 * @param customerId - Stripe customer ID
 * @returns Promise<Stripe.SetupIntent>
 */
export async function createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
  const stripe = getStripe();
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}

/**
 * Set default payment method for a customer
 * @param customerId - Stripe customer ID
 * @param paymentMethodId - Payment method ID
 * @returns Promise<Stripe.Customer>
 */
export async function setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
  const stripe = getStripe();
  return await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

/**
 * Delete a payment method
 * @param paymentMethodId - Payment method ID
 * @returns Promise<void>
 */
export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.paymentMethods.detach(paymentMethodId);
}

/**
 * Ensure a customer exists (create if not found)
 * @param email - Customer email
 * @param name - Optional customer name
 * @param uid - Optional Firebase UID
 * @returns Promise<Stripe.Customer>
 */
export async function ensureCustomer(email: string, name?: string, uid?: string): Promise<Stripe.Customer> {
  const stripe = getStripe();
  
  // First, try to find existing customer
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    
    // Update customer with new information if provided
    if (name || uid) {
      const updateData: Stripe.CustomerUpdateParams = {};
      if (name) updateData.name = name;
      if (uid) updateData.metadata = { ...customer.metadata, firebaseUid: uid };
      
      return await stripe.customers.update(customer.id, updateData);
    }
    
    return customer;
  }

  // If no existing customer, create a new one
  const customerData: Stripe.CustomerCreateParams = {
    email,
    metadata: {
      source: 'lazy-bread-web',
      firebaseUid: uid || '',
    },
  };
  
  if (name) {
    customerData.name = name;
  }

  return await stripe.customers.create(customerData);
} 