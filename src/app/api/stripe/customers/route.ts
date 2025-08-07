import { NextRequest, NextResponse } from 'next/server';
import { createOrFindCustomer } from '@/lib/stripeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const customer = await createOrFindCustomer(email, name);

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      name: customer.name
    });
  } catch (error) {
    console.error('Error creating/finding customer:', error);
    return NextResponse.json(
      { error: 'Failed to create or find customer' },
      { status: 500 }
    );
  }
} 