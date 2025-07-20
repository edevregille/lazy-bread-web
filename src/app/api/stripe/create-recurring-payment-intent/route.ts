import { NextRequest, NextResponse } from 'next/server';
import { createRecurringPaymentIntent } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, customerId, paymentMethodId, orderDetails } = body;

    if (!amount || !customerId || !paymentMethodId || !orderDetails) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create recurring payment intent using the library function
    const paymentIntent = await createRecurringPaymentIntent(
      amount,
      customerId,
      paymentMethodId,
      orderDetails
    );

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating recurring payment intent:', error);
    
    if (error && typeof error === 'object' && 'type' in error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'Payment failed' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 