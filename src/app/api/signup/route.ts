import { NextResponse, NextRequest } from "next/server";

import Stripe from "stripe";
let _stripe: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_API_KEY as string);
  }
  return _stripe;
};


export async function POST(req: NextRequest) {
  const { email, captchaToken } = await req.json();

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_CAPTCHA_SECRET_KEY}&response=${captchaToken}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    const responseJson = await response.json();
    console.log(responseJson)
    if(!responseJson.success){
      return NextResponse.json({error: true, message: "Could not verify your are not a robot."}, { status: 400 });
    }

    await getStripe().customers.create({email});
    return NextResponse.json({message: "Subscribed!"}, { status: 200 });

  } catch (err) {
    console.log(err);
    return NextResponse.json({error: true, message: "Could not get you sign-up. Try later"}, { status: 400 });
  }
}