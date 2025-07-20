import Stripe from 'stripe';

/**
 * Centralized Stripe customer management
 * Prevents duplicate customer creation and ensures consistent customer handling
 */
export class StripeCustomerManager {
  private static instance: StripeCustomerManager;
  private stripe: Stripe;

  private constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-02-24.acacia",
    });
  }

  public static getInstance(): StripeCustomerManager {
    if (!StripeCustomerManager.instance) {
      StripeCustomerManager.instance = new StripeCustomerManager();
    }
    return StripeCustomerManager.instance;
  }

  /**
   * Create or find a Stripe customer by email
   * @param email - Customer email
   * @param name - Optional customer name
   * @param metadata - Optional metadata
   * @returns Promise<Stripe.Customer>
   */
    async createOrFindCustomer(
    email: string, 
    name?: string, 
    metadata?: Record<string, string>
  ): Promise<Stripe.Customer> {
    console.log('StripeCustomerManager: Looking for existing customer with email:', email);
    
    try {
      // First, try to find existing customer
      const existingCustomers = await this.stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        console.log('StripeCustomerManager: Found existing customer:', customer.id);
        
        // Update customer with new information if provided
        if (name || metadata) {
          const updateData: Stripe.CustomerUpdateParams = {};
          if (name) updateData.name = name;
          if (metadata) updateData.metadata = metadata;
          
          const updatedCustomer = await this.stripe.customers.update(customer.id, updateData);
          console.log('StripeCustomerManager: Updated existing customer:', updatedCustomer.id);
          return updatedCustomer;
        }
        
        return customer;
      }

      // If no existing customer, create a new one
      console.log('StripeCustomerManager: Creating new customer for email:', email);
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

      const newCustomer = await this.stripe.customers.create(customerData);
      console.log('StripeCustomerManager: Created new customer:', newCustomer.id);
      return newCustomer;
    } catch (error) {
      console.error('StripeCustomerManager: Error in createOrFindCustomer:', error);
      throw new Error(`Failed to create or find Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a customer by ID
   * @param customerId - Stripe customer ID
   * @returns Promise<Stripe.Customer>
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
  }

  /**
   * Update a customer
   * @param customerId - Stripe customer ID
   * @param updateData - Customer update data
   * @returns Promise<Stripe.Customer>
   */
  async updateCustomer(
    customerId: string, 
    updateData: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    return await this.stripe.customers.update(customerId, updateData);
  }

  /**
   * Delete a customer
   * @param customerId - Stripe customer ID
   * @returns Promise<Stripe.DeletedCustomer>
   */
  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    return await this.stripe.customers.del(customerId);
  }
}

// Export singleton instance
export const stripeCustomerManager = StripeCustomerManager.getInstance();

// Convenience functions for backward compatibility
export const createOrFindCustomer = (email: string, name?: string, metadata?: Record<string, string>) => 
  stripeCustomerManager.createOrFindCustomer(email, name, metadata);

export const getCustomer = (customerId: string) => 
  stripeCustomerManager.getCustomer(customerId);

export const updateCustomer = (customerId: string, updateData: Stripe.CustomerUpdateParams) => 
  stripeCustomerManager.updateCustomer(customerId, updateData); 