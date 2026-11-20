import { randomUUID } from 'crypto';
import { after, NextRequest, NextResponse } from 'next/server';
import { createSetupIntent, createSetupIntentForDraft, createOrFindCustomer } from '@/lib/stripeService';
import {
  attachSetupIntentToDraft,
  isOrderDraftsEnabled,
  OrderDraftError,
  upsertOrderDraft,
} from '@/lib/orderDraftsService';

// The default (10 s) is too tight: a cold order drafts Lambda plus the Stripe calls can exceed it.
export const maxDuration = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderDetails } = body;

    if (!orderDetails?.customerInfo) {
      return NextResponse.json(
        { error: 'Order details are required' },
        { status: 400 }
      );
    }

    const customer = await createOrFindCustomer(
      orderDetails.customerInfo.email,
      orderDetails.customerInfo.name,
      undefined,
      'guest'
    );

    if (!isOrderDraftsEnabled()) {
      // Legacy flow: the whole order travels in the SetupIntent metadata.
      const setupIntent = await createSetupIntent(customer.id, orderDetails);
      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
        id: setupIntent.id,
        status: setupIntent.status,
        customerId: customer.id
      });
    }

    // Order drafts flow: save the order first, then create a SetupIntent that only
    // references it. A failure before the SetupIntent exists means the customer
    // cannot pay, so there is no way to end up with a charge but no order.
    const requestedId = typeof body.checkoutId === 'string' && UUID_RE.test(body.checkoutId)
      ? body.checkoutId
      : randomUUID();

    const draftInput = {
      stripeCustomerId: customer.id,
      order: orderDetails,
    };

    let draft;
    try {
      draft = await upsertOrderDraft({ ...draftInput, draftId: requestedId });
    } catch (error) {
      // 409: that checkout already became an order (stale id in the browser). Start a new one.
      if (error instanceof OrderDraftError && error.status === 409) {
        draft = await upsertOrderDraft({ ...draftInput, draftId: randomUUID() });
      } else {
        throw error;
      }
    }

    const setupIntent = await createSetupIntentForDraft(customer.id, draft.draftId, {
      termsAcceptedAt: orderDetails.termsAcceptedAt,
      termsVersion: orderDetails.termsVersion,
    });

    // Informational only (the webhook finds the draft through the SetupIntent metadata),
    // so it runs after the response is sent instead of making the customer wait.
    const draftId = draft.draftId;
    after(async () => {
      try {
        await attachSetupIntentToDraft(draftId, setupIntent.id);
      } catch (error) {
        console.error('Failed to attach setup intent to order draft (non-blocking):', {
          draftId,
          setupIntentId: setupIntent.id,
          error: error instanceof Error ? error.message : error,
        });
      }
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      id: setupIntent.id,
      status: setupIntent.status,
      customerId: customer.id,
      draftId: draft.draftId,
    });
  } catch (error) {
    if (error instanceof OrderDraftError && error.status >= 400 && error.status < 500 && error.status !== 401) {
      // Validation problems (e.g. an item is no longer available): show the message to the customer.
      console.warn('Order draft rejected:', { status: error.status, code: error.code, message: error.message });
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
