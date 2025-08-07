import { NextRequest, NextResponse } from 'next/server';
import { deletePaymentMethod } from '@/lib/stripeService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string, paymentMethodId: string }> }
) {
  try {
    const { paymentMethodId } = await params;
    await deletePaymentMethod(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}   