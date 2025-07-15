import { NextResponse, NextRequest } from "next/server";
import { verifyCaptcha, handleCaptchaError } from "@/lib/captcha";
import { createOrFindCustomer } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { email, captchaToken } = await req.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: true, message: "Valid email is required" },
        { status: 400 }
      );
    }

    // Verify CAPTCHA
    const captchaResult = await verifyCaptcha(captchaToken, true);
    const captchaError = handleCaptchaError(captchaResult);
    if (captchaError) {
      return captchaError;
    }

    // Create or find customer in Stripe
    const customer = await createOrFindCustomer(email);

    return NextResponse.json(
      { 
        success: true, 
        message: "Successfully subscribed!", 
        customerId: customer.id 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: true, message: "Could not complete signup. Please try again later." },
      { status: 500 }
    );
  }
} 