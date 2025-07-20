import { NextResponse, NextRequest } from "next/server";
import { verifyCaptcha, handleCaptchaError } from "@/lib/captcha";
import { createPaymentIntent } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { amount, captchaToken, orderDetails, userId, savePaymentMethod } = await req.json();

    console.log('Received request:', { amount, hasCaptchaToken: !!captchaToken, hasOrderDetails: !!orderDetails });

    // Verify CAPTCHA (only if required)
    const captchaResult = await verifyCaptcha(captchaToken, false); // Set to false since we disabled CAPTCHA requirement
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

    // Transform orderDetails to match the expected structure
    const transformedOrderDetails = {
      items: orderDetails.items,
      customerInfo: {
        name: orderDetails.customerName,
        email: orderDetails.email,
        address: orderDetails.address,
        city: orderDetails.city,
        zipCode: orderDetails.zipCode,
        phone: orderDetails.phone,
      },
      deliveryDate: orderDetails.deliveryDate,
      comments: orderDetails.comments,
    };

    // Create payment intent using the utility function
    const paymentIntent = await createPaymentIntent(amount, transformedOrderDetails, userId, savePaymentMethod);

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