import { NextRequest, NextResponse } from 'next/server';
import { createSetupIntent } from '@/lib/stripeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, orderDetails, userId } = body;

    const setupIntent = await createSetupIntent(customerId, orderDetails, userId);

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      id: setupIntent.id,
      status: setupIntent.status
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
} 