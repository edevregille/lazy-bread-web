import { NextRequest, NextResponse } from 'next/server';
import { createOrFindCustomer } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { email, name, metadata } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Creating or finding customer for email:', email);

    const customer = await createOrFindCustomer(email, name, metadata);

    console.log('Customer created/found successfully:', customer.id);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
        metadata: customer.metadata
      }
    });

  } catch (error) {
    console.error('Error creating/finding customer:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to create or find customer',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create or find customer' },
      { status: 500 }
    );
  }
} 