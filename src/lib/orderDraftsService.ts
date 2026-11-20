// Server-only (reads secrets): import from route handlers, never from client components.
// Client for the backend order drafts API (lambda_order_drafts).
// The full order is saved there before the Stripe SetupIntent is created, and
// the SetupIntent metadata only carries the draft id. See setup-intent/create.

export type OrderDraftInput = {
  draftId: string;
  stripeCustomerId: string;
  userId?: string;
  order: {
    items: Array<{ id: string; name: string; price?: number; quantity: number }>;
    customerInfo: {
      name: string;
      email: string;
      address: string;
      city: string;
      zipCode: string;
      phone?: string;
    };
    deliveryDate: string;
    comments?: string;
    fulfillmentType?: 'pickup' | 'delivery';
    pickupLocation?: string;
    termsAcceptedAt?: string;
    termsVersion?: string;
  };
};

export type OrderDraft = {
  draftId: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; total: number }>;
  totalAmount: number;
};

/** Error returned by the drafts API. 4xx messages are safe to show the customer. */
export class OrderDraftError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'OrderDraftError';
  }
}

export function isOrderDraftsEnabled(): boolean {
  return process.env.USE_ORDER_DRAFTS === 'true';
}

function config() {
  const url = process.env.ORDER_DRAFTS_API_URL;
  const key = process.env.ORDER_DRAFTS_API_KEY;
  if (!url || !key) {
    throw new Error('ORDER_DRAFTS_API_URL and ORDER_DRAFTS_API_KEY must be set when USE_ORDER_DRAFTS=true');
  }
  return { url, key };
}

async function call<T>(method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const { url, key } = config();
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-internal-key': key },
    body: JSON.stringify(body),
    cache: 'no-store',
    // Under the Lambda's 15 s timeout and the route's maxDuration, so a slow call fails cleanly.
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new OrderDraftError(
      typeof data.error === 'string' ? data.error : `Order drafts API returned ${response.status}`,
      response.status,
      typeof data.code === 'string' ? data.code : undefined,
    );
  }
  return data as T;
}

/** Create or replace the draft for this checkout. Prices come back from the server catalog. */
export function upsertOrderDraft(input: OrderDraftInput): Promise<OrderDraft> {
  return call<OrderDraft>('POST', input);
}

/** Record the SetupIntent on the draft (informational; the webhook uses the SetupIntent metadata). */
export function attachSetupIntentToDraft(draftId: string, stripeSetupIntentId: string): Promise<unknown> {
  return call('PATCH', { draftId, stripeSetupIntentId });
}
