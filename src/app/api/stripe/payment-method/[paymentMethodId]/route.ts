import { NextRequest, NextResponse } from 'next/server';
import { deletePaymentMethod } from '@/lib/stripe';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { paymentMethodId: string } }
) {
  try {
    const { paymentMethodId } = params;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment Method ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting payment method:', paymentMethodId);

    await deletePaymentMethod(paymentMethodId);

    console.log('Payment method deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to delete payment method',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
} 