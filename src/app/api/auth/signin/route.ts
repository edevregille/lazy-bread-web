import { NextRequest, NextResponse } from "next/server";
import { verifyCaptcha, handleCaptchaError } from "@/lib/captcha";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, captchaToken } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: true, message: "Email and password are required" },
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

    // Verify CAPTCHA (optional for signin, but good for security)
    const captchaResult = await verifyCaptcha(captchaToken, false);
    const captchaError = handleCaptchaError(captchaResult);
    if (captchaError) {
      return captchaError;
    }

    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    return NextResponse.json({
      success: true,
      message: "Signed in successfully",
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      }
    });

  } catch (error: unknown) {
    console.error('Signin error:', error);
    
    // Handle Firebase authentication errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      
      if (firebaseError.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: true, message: "No account found with this email address" },
          { status: 400 }
        );
      }
      
      if (firebaseError.code === 'auth/wrong-password') {
        return NextResponse.json(
          { error: true, message: "Incorrect password" },
          { status: 400 }
        );
      }
      
      if (firebaseError.code === 'auth/invalid-email') {
        return NextResponse.json(
          { error: true, message: "Invalid email address" },
          { status: 400 }
        );
      }
      
      if (firebaseError.code === 'auth/too-many-requests') {
        return NextResponse.json(
          { error: true, message: "Too many failed attempts. Please try again later" },
          { status: 429 }
        );
      }
      
      if (firebaseError.code === 'auth/user-disabled') {
        return NextResponse.json(
          { error: true, message: "This account has been disabled" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: true, message: "Failed to sign in. Please check your credentials." },
      { status: 500 }
    );
  }
} 