export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details: {
    name?: string;
    email?: string;
  };
}

export interface StripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  created: number;
  default_payment_method: string | null;
  metadata: Record<string, string>;
}

export interface CreateCustomerRequest {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerResponse {
  success: boolean;
  customer: {
    id: string;
    email: string | null;
    name: string | null;
    created: number;
    metadata: Record<string, string>;
  };
}

export interface CustomerResponse {
  success: boolean;
  customer: StripeCustomer;
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethodsResponse {
  success: boolean;
  paymentMethods: PaymentMethod[];
}

/**
 * Create or find a Stripe customer
 * @param email - Customer email
 * @param name - Optional customer name
 * @param metadata - Optional metadata
 * @returns Promise<CreateCustomerResponse>
 */
export async function createOrFindCustomer(
  email: string, 
  name?: string, 
  metadata?: Record<string, string>
): Promise<CreateCustomerResponse> {
  const response = await fetch('/api/stripe/create-or-find-customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name, metadata }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create or find customer');
  }
  
  return response.json();
}

/**
 * Get customer information and payment methods
 * @param customerId - Stripe customer ID
 * @returns Promise<CustomerResponse>
 */
export async function getCustomerInfo(customerId: string): Promise<CustomerResponse> {
  const response = await fetch(`/api/stripe/customer/${customerId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch customer information');
  }
  
  return response.json();
}

/**
 * Get payment methods for a customer
 * @param customerId - Stripe customer ID
 * @returns Promise<PaymentMethodsResponse>
 */
export async function getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
  const response = await fetch(`/api/stripe/customer/${customerId}/payment-methods`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch payment methods');
  }
  
  const data = await response.json();
  return data?.paymentMethods ? data.paymentMethods : [] ;
}

/**
 * Create a setup intent for saving payment methods
 * @param customerId - Stripe customer ID
 * @returns Promise<{ clientSecret: string }>
 */
export async function createSetupIntent(customerId: string): Promise<{ clientSecret: string }> {
  const response = await fetch('/api/stripe/create-setup-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customerId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create setup intent');
  }
  
  return response.json();
}

/**
 * Set default payment method for a customer
 * @param customerId - Stripe customer ID
 * @param paymentMethodId - Payment method ID
 * @returns Promise<void>
 */
export async function setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
  const response = await fetch('/api/stripe/set-default-payment-method', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customerId, paymentMethodId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to set default payment method');
  }
}

/**
 * Delete a payment method
 * @param paymentMethodId - Payment method ID
 * @returns Promise<void>
 */
export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  const response = await fetch(`/api/stripe/payment-method/${paymentMethodId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete payment method');
  }
} 
