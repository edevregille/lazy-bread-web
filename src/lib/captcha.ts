import { NextResponse } from "next/server";

export interface CaptchaVerificationResult {
  success: boolean;
  message?: string;
}

/**
 * Verifies a Google reCAPTCHA token
 * @param captchaToken - The token from the frontend
 * @param required - Whether CAPTCHA is required (default: true)
 * @returns Promise<CaptchaVerificationResult>
 */
export async function verifyCaptcha(
  captchaToken: string | null | undefined,
  required: boolean = true
): Promise<CaptchaVerificationResult> {
  // If CAPTCHA is not configured, skip verification
  if (!process.env.GOOGLE_CAPTCHA_SECRET_KEY) {
    if (required) {
      return {
        success: false,
        message: "CAPTCHA is not configured on the server"
      };
    }
    return { success: true };
  }

  // If CAPTCHA is required but no token provided
  if (required && !captchaToken) {
    return {
      success: false,
      message: "CAPTCHA verification required"
    };
  }

  // If CAPTCHA is not required and no token provided, skip verification
  if (!required && !captchaToken) {
    return { success: true };
  }

  try {
    // Verify CAPTCHA with Google
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_CAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to verify CAPTCHA with Google"
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: "CAPTCHA verification failed"
      };
    }

    return { success: true };

  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return {
      success: false,
      message: "CAPTCHA verification error"
    };
  }
}

/**
 * Helper function to create a standardized error response for CAPTCHA failures
 * @param result - The captcha verification result
 * @returns NextResponse or null if verification succeeded
 */
export function handleCaptchaError(result: CaptchaVerificationResult): NextResponse | null {
  if (!result.success) {
    return NextResponse.json(
      { error: true, message: result.message || "CAPTCHA verification failed" },
      { status: 400 }
    );
  }
  return null;
} 