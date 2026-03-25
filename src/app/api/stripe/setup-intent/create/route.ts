import { NextRequest, NextResponse } from 'next/server';
import { createSetupIntent, createOrFindCustomer } from '@/lib/stripeService';
import {
  verifyFirebaseIdToken,
  findUserDocByUid,
  updateUserStripeCustomerId,
  createUserDocWithStripe,
  getAuthUserForUid,
} from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, orderDetails, userId, frequency, isRecurring, isGuest } = body;

    let finalCustomerId = customerId;

    // If guest user, create customer with appropriate customerType
    if (isGuest && orderDetails?.customerInfo) {
      const customerType = isRecurring ? 'recurring' : 'guest';
      const customer = await createOrFindCustomer(
        orderDetails.customerInfo.email,
        orderDetails.customerInfo.name,
        undefined,
        customerType
      );
      finalCustomerId = customer.id;
    }

    // Logged-in user without customerId: resolve from Firestore or create Stripe customer + persist
    if (!finalCustomerId && !isGuest && userId) {
      const authHeader = request.headers.get('authorization');
      const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!bearer) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      let decoded;
      try {
        decoded = await verifyFirebaseIdToken(bearer);
      } catch {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      if (decoded.uid !== userId) {
        return NextResponse.json(
          { error: 'Token does not match user' },
          { status: 401 }
        );
      }

      const userDoc = await findUserDocByUid(userId);

      if (userDoc?.stripeCustomerId) {
        finalCustomerId = userDoc.stripeCustomerId;
      } else {
        let email: string | undefined = userDoc?.email;
        let displayName: string | undefined = userDoc?.displayName;

        if (!email && orderDetails?.customerInfo?.email) {
          email = orderDetails.customerInfo.email;
        }
        if (!displayName && orderDetails?.customerInfo?.name) {
          displayName = orderDetails.customerInfo.name;
        }

        if (!email) {
          try {
            const authUser = await getAuthUserForUid(userId);
            email = authUser.email ?? undefined;
            if (!displayName) {
              displayName = authUser.displayName ?? undefined;
            }
          } catch {
            // handled below if still no email
          }
        }

        if (!email) {
          return NextResponse.json(
            { error: 'User email is required to create a Stripe customer' },
            { status: 400 }
          );
        }

        const customerType = isRecurring ? 'recurring' : 'one_time';
        const customer = await createOrFindCustomer(
          email,
          displayName,
          { firebaseUid: userId },
          customerType
        );

        if (userDoc) {
          await updateUserStripeCustomerId(userDoc.docId, customer.id);
        } else {
          await createUserDocWithStripe({
            uid: userId,
            email,
            displayName,
            stripeCustomerId: customer.id,
          });
        }

        finalCustomerId = customer.id;
      }
    }

    if (!finalCustomerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const setupIntent = await createSetupIntent(
      finalCustomerId,
      orderDetails,
      userId,
      frequency,
      isRecurring || false
    );

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      id: setupIntent.id,
      status: setupIntent.status,
      customerId: finalCustomerId
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
