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
  try {
    const { amount, captchaToken, orderDetails } = await req.json();

    // Verify CAPTCHA (only if configured)
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!captchaToken) {
        return NextResponse.json(
          { error: true, message: "CAPTCHA verification required" },
          { status: 400 }
        );
      }

      // Verify CAPTCHA with Google
      const captchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
        { method: 'POST' }
      );
      
      const captchaResult = await captchaResponse.json();
      
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: true, message: "CAPTCHA verification failed" },
          { status: 400 }
        );
      }
    }

    if (!amount || amount < 50) { // Minimum 50 cents
      return NextResponse.json(
        { error: true, message: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!orderDetails) {
      return NextResponse.json(
        { error: true, message: "Order details are required" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        items: JSON.stringify(orderDetails.items),
        customerName: orderDetails.customerInfo.name,
        customerEmail: orderDetails.customerInfo.email,
        deliveryAddress: `${orderDetails.customerInfo.address}, ${orderDetails.customerInfo.city}, ${orderDetails.customerInfo.zipCode}`,
        deliveryDate: orderDetails.deliveryDate,
        comments: orderDetails.comments || '',
      },
      description: orderDetails.comments || `${orderDetails.items.length} item(s) - ${orderDetails.customerInfo.name}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: true, message: "Failed to create payment intent" },
      { status: 500 }
    );
  }
} 