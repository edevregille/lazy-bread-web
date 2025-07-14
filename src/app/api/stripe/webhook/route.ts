import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-01-27.acacia',
    });
  }
  return _stripe;
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Here you would typically:
        // 1. Update your database with the order status
        // 2. Send confirmation emails
        // 3. Notify your fulfillment team
        // 4. Update inventory
        
        console.log('Order details from metadata:', {
          items: JSON.parse(paymentIntent.metadata.items || '[]'),
          customerName: paymentIntent.metadata.customerName,
          customerEmail: paymentIntent.metadata.customerEmail,
          deliveryAddress: paymentIntent.metadata.deliveryAddress,
          deliveryDate: paymentIntent.metadata.deliveryDate,
          comments: paymentIntent.metadata.comments,
        });
        
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        
        // Here you would typically:
        // 1. Update order status to failed
        // 2. Send failure notification to customer
        // 3. Log the failure for review
        
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 