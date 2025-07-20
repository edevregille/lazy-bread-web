import { 
  getCustomer, 
  getCustomerPaymentMethods as getCustomerPaymentMethodsSDK, 
  createSetupIntent as createSetupIntentSDK,
  setDefaultPaymentMethod as setDefaultPaymentMethodSDK,
  deletePaymentMethod as deletePaymentMethodSDK,
  ensureCustomer
} from './stripe';

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
  email: string;
  name?: string;
  payment_methods: PaymentMethod[];
  default_payment_method?: string;
}

export const createStripeCustomer = async (email: string, name?: string): Promise<StripeCustomer> => {
  try {
    console.log('createStripeCustomer called with:', { email, name });
    
    const customer = await ensureCustomer(email, name);
    const paymentMethods = await getCustomerPaymentMethodsSDK(customer.id);
    
    return {
      id: customer.id,
      email: customer.email ?? '',
      name: customer.name ?? undefined,
      payment_methods: paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        } : undefined,
        billing_details: {
          name: pm.billing_details?.name ?? undefined,
          email: pm.billing_details?.email ?? undefined,
        }
      })),
      default_payment_method: typeof customer.invoice_settings?.default_payment_method === 'string' 
        ? customer.invoice_settings.default_payment_method 
        : undefined,
    };
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create/find customer');
  }
};

export const getStripeCustomer = async (customerId: string): Promise<StripeCustomer> => {
  try {
    const customer = await getCustomer(customerId);
    const paymentMethods = await getCustomerPaymentMethodsSDK(customer.id);
    
    return {
      id: customer.id,
      email: customer.email ?? '',
      name: customer.name ?? undefined,
      payment_methods: paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        } : undefined,
        billing_details: {
          name: pm.billing_details?.name ?? undefined,
          email: pm.billing_details?.email ?? undefined,
        }
      })),
      default_payment_method: typeof customer.invoice_settings?.default_payment_method === 'string' 
        ? customer.invoice_settings.default_payment_method 
        : undefined,
    };
  } catch (error) {
    console.error('Error fetching Stripe customer:', error);
    throw new Error('Failed to fetch customer');
  }
};

export const getCustomerPaymentMethods = async (customerId: string): Promise<PaymentMethod[]> => {
  try {
    const paymentMethods = await getCustomerPaymentMethodsSDK(customerId);
    
    return paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      } : undefined,
      billing_details: {
        name: pm.billing_details?.name ?? undefined,
        email: pm.billing_details?.email ?? undefined,
      }
    }));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw new Error('Failed to fetch payment methods');
  }
};

export const createSetupIntent = async (customerId: string): Promise<{ clientSecret: string }> => {
  try {
    const setupIntent = await createSetupIntentSDK(customerId);
    return { clientSecret: setupIntent.client_secret! };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw new Error('Failed to create setup intent');
  }
};

export const setDefaultPaymentMethod = async (customerId: string, paymentMethodId: string): Promise<void> => {
  try {
    await setDefaultPaymentMethodSDK(customerId, paymentMethodId);
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw new Error('Failed to set default payment method');
  }
};

export const deletePaymentMethod = async (paymentMethodId: string): Promise<void> => {
  try {
    await deletePaymentMethodSDK(paymentMethodId);
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw new Error('Failed to delete payment method');
  }
}; 

export const ensureStripeCustomer = async (email: string, name?: string, uid?: string): Promise<StripeCustomer> => {
  try {
    console.log('ensureStripeCustomer called with:', { email, name, uid });
    
    const customer = await ensureCustomer(email, name, uid);
    const paymentMethods = await getCustomerPaymentMethodsSDK(customer.id);
    
    return {
      id: customer.id,
      email: customer.email ?? '',
      name: customer.name ?? undefined,
      payment_methods: paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        } : undefined,
        billing_details: {
          name: pm.billing_details?.name ?? undefined,
          email: pm.billing_details?.email ?? undefined,
        }
      })),
      default_payment_method: typeof customer.invoice_settings?.default_payment_method === 'string' 
        ? customer.invoice_settings.default_payment_method 
        : undefined,
    };
  } catch (error) {
    console.error('Error ensuring Stripe customer:', error);
    throw new Error('Failed to ensure customer exists');
  }
}; 