import { NextRequest, NextResponse } from 'next/server';
import { setDefaultPaymentMethod } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { customerId, paymentMethodId } = await request.json();

    if (!customerId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Customer ID and Payment Method ID are required' },
        { status: 400 }
      );
    }

    console.log('Setting default payment method:', { customerId, paymentMethodId });

    await setDefaultPaymentMethod(customerId, paymentMethodId);

    console.log('Default payment method set successfully');

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated successfully'
    });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to set default payment method',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to set default payment method' },
      { status: 500 }
    );
  }
} 