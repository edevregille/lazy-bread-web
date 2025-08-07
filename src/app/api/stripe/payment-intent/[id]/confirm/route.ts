import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentIntent } from '@/lib/stripeService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentIntentId } = await params;
    const paymentIntent = await confirmPaymentIntent(paymentIntentId);

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment intent' },
      { status: 500 }
    );
  }
} 