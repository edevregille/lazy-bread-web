import { NextRequest, NextResponse } from 'next/server';
import { createSetupIntent } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    console.log('Creating setup intent for customer:', customerId);

    const setupIntent = await createSetupIntent(customerId);

    console.log('Setup intent created successfully');

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to create setup intent',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
} 