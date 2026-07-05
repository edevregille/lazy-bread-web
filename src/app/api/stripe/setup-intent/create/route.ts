import { NextRequest, NextResponse } from 'next/server';
import { createSetupIntent, createOrFindCustomer } from '@/lib/stripeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderDetails } = body;

    if (!orderDetails?.customerInfo) {
      return NextResponse.json(
        { error: 'Order details are required' },
        { status: 400 }
      );
    }

    const customer = await createOrFindCustomer(
      orderDetails.customerInfo.email,
      orderDetails.customerInfo.name,
      undefined,
      'guest'
    );

    const setupIntent = await createSetupIntent(customer.id, orderDetails);

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      id: setupIntent.id,
      status: setupIntent.status,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
