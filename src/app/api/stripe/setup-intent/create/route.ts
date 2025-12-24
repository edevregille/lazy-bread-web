import { NextRequest, NextResponse } from 'next/server';
import { createSetupIntent, createOrFindCustomer } from '@/lib/stripeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, orderDetails, userId, frequency, isRecurring, isGuest } = body;

    let finalCustomerId = customerId;

    // If guest user, create customer with appropriate customerType
    if (isGuest && orderDetails?.customerInfo) {
      const customerType = isRecurring ? 'recurring' : 'guest';
      const customer = await createOrFindCustomer(
        orderDetails.customerInfo.email,
        orderDetails.customerInfo.name,
        undefined,
        customerType
      );
      finalCustomerId = customer.id;
    }

    if (!finalCustomerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const setupIntent = await createSetupIntent(
      finalCustomerId,
      orderDetails,
      userId,
      frequency,
      isRecurring || false
    );

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      id: setupIntent.id,
      status: setupIntent.status,
      customerId: finalCustomerId
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
} 