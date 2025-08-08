import { NextRequest, NextResponse } from 'next/server';
import { createOrFindCustomer } from '@/lib/stripeService';

export async function POST(request: NextRequest) {
  try {
    const { email, name, metadata } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const customer = await createOrFindCustomer(email, name, metadata);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        metadata: customer.metadata
      }
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
} 