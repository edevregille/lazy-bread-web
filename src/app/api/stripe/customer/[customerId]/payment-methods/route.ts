import { NextRequest, NextResponse } from 'next/server';
import { getCustomerPaymentMethods } from '@/lib/stripe';

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

    console.log('Fetching payment methods for customer:', customerId);

    // Get customer payment methods
    const paymentMethods = await getCustomerPaymentMethods(customerId);

    console.log('Payment methods fetched successfully');

    return NextResponse.json({
      success: true,
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
    console.error('Error fetching payment methods:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch payment methods',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
