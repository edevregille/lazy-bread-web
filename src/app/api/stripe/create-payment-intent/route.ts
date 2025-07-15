import { NextResponse, NextRequest } from "next/server";
import { verifyCaptcha, handleCaptchaError } from "@/lib/captcha";
import { createPaymentIntent } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { amount, captchaToken, orderDetails } = await req.json();

    // Verify CAPTCHA
    const captchaResult = await verifyCaptcha(captchaToken, true);
    const captchaError = handleCaptchaError(captchaResult);
    if (captchaError) {
      return captchaError;
    }

    // Validate amount
    if (!amount || amount < 50) { // Minimum 50 cents
      return NextResponse.json(
        { error: true, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Validate order details
    if (!orderDetails) {
      return NextResponse.json(
        { error: true, message: "Order details are required" },
        { status: 400 }
      );
    }

    // Create payment intent using the utility function
    const paymentIntent = await createPaymentIntent(amount, orderDetails);

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