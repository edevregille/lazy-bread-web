import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentIntent } from '@/lib/stripeService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentIntentId = params.id;
    const body = await request.json();
    const { paymentMethodId } = body;

    const paymentIntent = await updatePaymentIntent(paymentIntentId, paymentMethodId);

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Error updating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
} 