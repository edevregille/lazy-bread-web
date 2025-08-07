import { NextRequest, NextResponse } from 'next/server';
import { confirmSetupIntent } from '@/lib/stripeService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const setupIntentId = params.id;
    const setupIntent = await confirmSetupIntent(setupIntentId);

    return NextResponse.json({
      id: setupIntent.id,
      status: setupIntent.status
    });
  } catch (error) {
    console.error('Error confirming setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to confirm setup intent' },
      { status: 500 }
    );
  }
} 