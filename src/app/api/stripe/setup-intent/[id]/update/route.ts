import { NextRequest, NextResponse } from 'next/server';
import { updateSetupIntent } from '@/lib/stripeService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: setupIntentId } = await params;
    const body = await request.json();
    const { paymentMethodId } = body;

    const setupIntent = await updateSetupIntent(setupIntentId, paymentMethodId);

    return NextResponse.json({
      id: setupIntent.id,
      status: setupIntent.status
    });
  } catch (error) {
    console.error('Error updating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
} 