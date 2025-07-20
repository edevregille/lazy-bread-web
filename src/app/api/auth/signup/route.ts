import { NextRequest, NextResponse } from "next/server";
import { verifyCaptcha, handleCaptchaError } from "@/lib/captcha";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { createUserProfile } from "@/lib/firebaseService";
import { stripeCustomerManager } from "@/lib/stripeCustomerManager";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, captchaToken } = await req.json();

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: true, message: "Email, password, and display name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: true, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: true, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Verify CAPTCHA
    const captchaResult = await verifyCaptcha(captchaToken, true);
    const captchaError = handleCaptchaError(captchaResult);
    if (captchaError) {
      return captchaError;
    }

    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(userCredential.user, { displayName });
    
    // Create user profile and Stripe customer
    try {
      const stripeCustomer = await stripeCustomerManager.createOrFindCustomer(email, displayName, {
        source: 'lazy-bread-web',
        userId: userCredential.user.uid, // Store user ID for order linking
      });
      
      await createUserProfile({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: displayName,
        stripeCustomerId: stripeCustomer.id,
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Don't continue if profile creation fails - this is critical
      throw new Error('Failed to create user profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      }
    });

  } catch (error: unknown) {
    console.error('Signup error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Handle Firebase authentication errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      console.error('Firebase error code:', firebaseError.code);
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { error: true, message: "An account with this email already exists" },
          { status: 400 }
        );
      }
      
      if (firebaseError.code === 'auth/weak-password') {
        return NextResponse.json(
          { error: true, message: "Password is too weak" },
          { status: 400 }
        );
      }
      
      if (firebaseError.code === 'auth/invalid-email') {
        return NextResponse.json(
          { error: true, message: "Invalid email address" },
          { status: 400 }
        );
      }
    }

    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: true, message: `Failed to create account: ${errorMessage}` },
      { status: 500 }
    );
  }
} 