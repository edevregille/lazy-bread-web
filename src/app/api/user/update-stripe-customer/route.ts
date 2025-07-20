import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/firebaseService';

export async function POST(request: NextRequest) {
  try {
    const { uid, stripeCustomerId } = await request.json();

    if (!uid || !stripeCustomerId) {
      return NextResponse.json(
        { error: 'User ID and Stripe Customer ID are required' },
        { status: 400 }
      );
    }

    await updateUserProfile(uid, { stripeCustomerId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user Stripe customer ID:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 