import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent, createPaymentIntentWithSavedMethod } from '@/lib/stripeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderDetails, userId, paymentMethodId } = body;
    let paymentIntent;
    if(paymentMethodId) {
      paymentIntent = await createPaymentIntentWithSavedMethod(amount, orderDetails, userId, paymentMethodId);
    } else {
      paymentIntent = await createPaymentIntent(amount, orderDetails, userId);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 