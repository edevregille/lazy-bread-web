# Library Utilities

This directory contains reusable utilities for the Lazy Bread application.

## Files

### `captcha.ts`
Reusable CAPTCHA verification utilities for Google reCAPTCHA.

**Functions:**
- `verifyCaptcha(captchaToken, required?)` - Verifies a CAPTCHA token
- `handleCaptchaError(result)` - Creates standardized error responses

**Usage:**
```typescript
import { verifyCaptcha, handleCaptchaError } from '@/lib/captcha';

const captchaResult = await verifyCaptcha(captchaToken, true);
const captchaError = handleCaptchaError(captchaResult);
if (captchaError) {
  return captchaError;
}
```

### `stripe.ts`
Stripe integration utilities for customer management and payment processing.

**Functions:**
- `getStripe()` - Returns singleton Stripe instance
- `createOrFindCustomer(email)` - Creates or finds existing customer
- `createPaymentIntent(amount, orderDetails)` - Creates payment intent with metadata

**Usage:**
```typescript
import { createOrFindCustomer, createPaymentIntent } from '@/lib/stripe';

const customer = await createOrFindCustomer(email);
const paymentIntent = await createPaymentIntent(amount, orderDetails);
```

## API Routes

### `/api/stripe/signup`
Handles email signup with CAPTCHA verification and Stripe customer creation.

**Request:**
```json
{
  "email": "user@example.com",
  "captchaToken": "recaptcha_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed!",
  "customerId": "cus_xxx"
}
```

### `/api/stripe/create-payment-intent`
Creates Stripe payment intent with order details and CAPTCHA verification.

**Request:**
```json
{
  "amount": 1000,
  "captchaToken": "recaptcha_token",
  "orderDetails": {
    "items": [...],
    "customerInfo": {...},
    "deliveryDate": "2025-01-01",
    "comments": "Optional comments"
  }
}
```

## Environment Variables

Required environment variables:
- `STRIPE_SECRET_KEY` - Stripe secret key
- `GOOGLE_CAPTCHA_SECRET_KEY` - Google reCAPTCHA secret key 