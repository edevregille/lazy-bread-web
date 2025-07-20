import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntentWithSavedMethod } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethodId, customerId, orderDetails, userId } = body;

    if (!amount || !paymentMethodId || !customerId || !orderDetails) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment intent with the saved payment method using the library function
    const paymentIntent = await createPaymentIntentWithSavedMethod(
      amount,
      customerId,
      paymentMethodId,
      orderDetails,
      userId
    );

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent with saved method:', error);
    
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