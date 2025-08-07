import { NextRequest, NextResponse } from 'next/server';
import { getCustomer, getCustomerPaymentMethods } from '@/lib/stripeService';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching customer information for:', customerId);

    // Get customer information
    const customer = await getCustomer(customerId);
    
    // Get customer payment methods
    const paymentMethods = await getCustomerPaymentMethods(customerId);

    console.log('Customer and payment methods fetched successfully');

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
        default_payment_method: customer.invoice_settings?.default_payment_method,
        metadata: customer.metadata
      },
      paymentMethods: paymentMethods.map(pm => ({
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
      }))
    });

  } catch (error) {
    console.error('Error fetching customer information:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch customer information',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch customer information' },
      { status: 500 }
    );
  }
} 