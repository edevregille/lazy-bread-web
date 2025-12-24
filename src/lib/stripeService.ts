'use server';

import Stripe from "stripe";
import { StripeCustomer } from "./types";

let _stripe: Stripe | null = null;

/**
 * Get or create Stripe instance
 * @returns Stripe instance
 */
export const getStripe = async (): Promise<Stripe> => {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    
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
 * @param customerType - Optional customer type ('guest' | 'one_time' | 'recurring')
 * @returns Promise<StripeCustomer>
 */
export async function createOrFindCustomer(
  email: string, 
  name?: string, 
  metadata?: Record<string, string>,
  customerType?: 'guest' | 'one_time' | 'recurring'
): Promise<StripeCustomer> {
  const stripe = await getStripe();  
  try {
    // First, try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      
      // Update customer with new information if provided
      if (name || metadata || customerType) {
        const updateData: Stripe.CustomerUpdateParams = {};
        if (name) updateData.name = name;
        const mergedMetadata = {
          ...customer.metadata,
          ...metadata,
        };
        if (customerType) {
          mergedMetadata.customerType = customerType;
        }
        updateData.metadata = mergedMetadata;
        
        const updatedCustomer = await stripe.customers.update(customer.id, updateData);        
        // Return only serializable properties
        return {
          id: updatedCustomer.id,
          email: updatedCustomer.email,
          name: updatedCustomer.name || null,
          created: updatedCustomer.created,
          metadata: updatedCustomer.metadata,
        };
      }
      
      // Return only serializable properties
      return {
        id: customer.id,
        email: customer.email,
        name: customer.name || null,
        created: customer.created,
        metadata: customer.metadata,
      };
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
    
    if (customerType) {
      customerData.metadata = {
        ...customerData.metadata,
        customerType: customerType,
      };
    }
    
    if (name) {
      customerData.name = name;
    }

    const newCustomer = await stripe.customers.create(customerData);
    console.log('Created new customer:', newCustomer.id);
    return {
      id: newCustomer.id,
      email: newCustomer.email,
      name: newCustomer.name || null,
      created: newCustomer.created,
      metadata: newCustomer.metadata,
    };
  } catch (error) {
    console.error('Error in createOrFindCustomer:', error);
    throw new Error(`Failed to create or find Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a Stripe customer by ID
 * @param customerId - Stripe customer ID
 * @returns Promise<Stripe.Customer>
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  const stripe = await getStripe();
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
}

/**
 * Update a customer
 * @param customerId - Stripe customer ID
 * @param updateData - Customer update data
 * @returns Promise<Stripe.Customer>
 */
export async function updateCustomer(
  customerId: string, 
  updateData: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const stripe = await getStripe();
  return await stripe.customers.update(customerId, updateData);
}

/**
 * Delete a customer
 * @param customerId - Stripe customer ID
 * @returns Promise<Stripe.DeletedCustomer>
 */
export async function deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
  const stripe = await getStripe();
  return await stripe.customers.del(customerId);
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
  const stripe = await getStripe();

  // Create or find customer
  const customer = await createOrFindCustomer(orderDetails.customerInfo.email);

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: amount,
    currency: 'usd',
    capture_method: 'manual',
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
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
  const stripe = await getStripe();

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount), // Ensure amount is in cents
    currency: 'usd',
    capture_method: 'manual',
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true, // Confirm the payment immediately
    return_url: `${process.env.HOSTNAME}/order/payment/success`,
    // off_session: true, // Since we're using a saved payment method
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
  const stripe = await getStripe();

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
 * Get payment methods for a customer
 * @param customerId - Stripe customer ID
 * @returns Promise<Stripe.PaymentMethod[]>
 */
export async function getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const stripe = await getStripe();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return paymentMethods.data;
}

/**
 * Create a setup intent for saving payment methods
 * @param customerId - Stripe customer ID
 * @param orderDetails - Optional order details to store as metadata
 * @param userId - Optional user ID
 * @param frequency - Optional delivery frequency (for recurring orders)
 * @param isRecurring - Whether this is a recurring order (default: false)
 * @returns Promise<Stripe.SetupIntent>
 */
export async function createSetupIntent(
  customerId: string,
  orderDetails?: {
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
  frequency?: 'weekly' | 'bi-weekly' | 'every-4-weeks',
  isRecurring: boolean = false,
): Promise<Stripe.SetupIntent> {
  const stripe = await getStripe();

  const setupIntentData: Stripe.SetupIntentCreateParams = {
    customer: customerId,
    usage: 'off_session', // Allow using saved payment method off_session
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    metadata: orderDetails ? {
      orderType: 'online',
      items: JSON.stringify(orderDetails.items),
      customerName: orderDetails.customerInfo.name,
      customerEmail: orderDetails.customerInfo.email,
      address: orderDetails.customerInfo.address,
      city: orderDetails.customerInfo.city,
      zipCode: orderDetails.customerInfo.zipCode,
      phone: orderDetails.customerInfo.phone || '',
      deliveryDate: orderDetails.deliveryDate,
      comments: orderDetails.comments || '',
      isRecurring: isRecurring ? 'true' : 'false',
      userId: userId || '',
      ...(isRecurring && frequency ? { frequency: frequency } : {}),
    } : {
      isRecurring: isRecurring ? 'true' : 'false',
    },
  };

  return await stripe.setupIntents.create(setupIntentData);
}

export async function updateSetupIntent(setupIntentId: string, paymentMethodId: string): Promise<Stripe.SetupIntent> {
  const stripe = await getStripe();
  return await stripe.setupIntents.update(setupIntentId, {
    payment_method: paymentMethodId,
  });
}

export async function confirmSetupIntent(setupIntentId: string): Promise<Stripe.SetupIntent> {
  const stripe = await getStripe();
  return await stripe.setupIntents.confirm(setupIntentId);
}

/**
 * Set default payment method for a customer
 * @param customerId - Stripe customer ID
 * @param paymentMethodId - Payment method ID
 * @returns Promise<Stripe.Customer>
 */
export async function setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
  const stripe = await getStripe();
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
  const stripe = await getStripe();
  await stripe.paymentMethods.detach(paymentMethodId);
}

/**
 * Capture a payment intent
 * @param paymentIntentId - Payment intent ID
 * @param amount - Optional amount to capture (if different from original)
 * @returns Promise<Stripe.PaymentIntent>
 */
export async function capturePaymentIntent(
  paymentIntentId: string, 
  amount?: number
): Promise<Stripe.PaymentIntent> {
  const stripe = await getStripe();
  const captureData: Stripe.PaymentIntentCaptureParams = {};
  
  if (amount) {
    captureData.amount_to_capture = amount;
  }
  
  return await stripe.paymentIntents.capture(paymentIntentId, captureData);
}

/**
 * Retrieve a payment intent
 * @param paymentIntentId - Payment intent ID
 * @returns Promise<Stripe.PaymentIntent>
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const stripe = await getStripe();
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Cancel a payment intent
 * @param paymentIntentId - Payment intent ID
 * @returns Promise<Stripe.PaymentIntent>
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const stripe = await getStripe();
  return await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * List customers with optional filters
 * @param options - List options
 * @returns Promise<Stripe.ApiList<Stripe.Customer>>
 */
export async function listCustomers(options?: {
  email?: string;
  limit?: number;
  starting_after?: string;
}): Promise<Stripe.ApiList<Stripe.Customer>> {
  const stripe = await getStripe();
  return await stripe.customers.list(options);
}

/**
 * Search for customers
 * @param query - Search query
 * @returns Promise<Stripe.ApiSearchResult<Stripe.Customer>>
 */
export async function searchCustomers(query: string): Promise<Stripe.ApiSearchResult<Stripe.Customer>> {
  const stripe = await getStripe();
  return await stripe.customers.search({
    query: query,
  });
}

export async function updatePaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<Stripe.PaymentIntent> {
  const stripe = await getStripe();
  return await stripe.paymentIntents.update(paymentIntentId, {
    payment_method: paymentMethodId,
  });
}

export async function confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const stripe = await getStripe();
  return await stripe.paymentIntents.confirm(paymentIntentId);
}