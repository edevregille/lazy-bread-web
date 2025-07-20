# Stripe Payment Methods Setup

This guide will help you set up Stripe payment methods for the Lazy Bread web application.

## 1. Create a Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up for a new account or sign in to existing account
3. Complete the account setup process
4. Note your API keys from the Dashboard

## 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Keep your existing Firebase and reCAPTCHA configuration
```

## 3. Webhook Setup

1. In your Stripe Dashboard, go to "Developers" > "Webhooks"
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `setup_intent.succeeded`
   - `setup_intent.setup_failed`
5. Click "Add endpoint"
6. Copy the webhook signing secret and add it to your environment variables

## 4. Test the Setup

### 4.1 Test Payment Method Addition

1. Start your development server: `npm run dev`
2. Sign in to your account
3. Go to Dashboard > Payment Methods
4. Click "Add Payment Method"
5. Use Stripe's test card numbers:
   - **Visa**: `4242424242424242`
   - **Mastercard**: `5555555555554444`
   - **American Express**: `378282246310005`
   - **Any future date** for expiry
   - **Any 3-digit CVC**

### 4.2 Test Payment Processing

1. Place a test order
2. Use the saved payment method
3. Verify the payment goes through successfully

## 5. Features Implemented

### 5.1 Payment Method Management

- **Add Payment Methods**: Users can add new cards using Stripe Elements
- **View Payment Methods**: Display saved cards with masked numbers
- **Set Default Method**: Choose which card to use by default
- **Delete Payment Methods**: Remove cards from the account
- **Automatic Customer Creation**: Stripe customers are created automatically for new users

### 5.2 Integration Points

- **User Registration**: Automatically creates Stripe customer on signup
- **Order Processing**: Uses saved payment methods for faster checkout
- **Recurring Orders**: Supports automatic payments for subscription orders
- **Dashboard Integration**: Payment methods are displayed in user dashboard

### 5.3 Security Features

- **PCI Compliance**: All card data is handled by Stripe
- **Tokenization**: Cards are stored as tokens, not actual numbers
- **Webhook Verification**: All webhook events are verified using signatures
- **Customer Isolation**: Each user has their own Stripe customer

## 6. API Endpoints

### 6.1 Payment Method Management

- `POST /api/stripe/create-customer` - Create new Stripe customer
- `POST /api/stripe/create-setup-intent` - Create setup intent for adding payment method
- `GET /api/stripe/customer/[customerId]/payment-methods` - Get customer's payment methods
- `POST /api/stripe/set-default-payment-method` - Set default payment method
- `DELETE /api/stripe/payment-method/[paymentMethodId]` - Delete payment method

### 6.2 User Profile Management

- `POST /api/user/update-stripe-customer` - Update user's Stripe customer ID

### 6.3 Webhook Processing

- `POST /api/stripe/webhook` - Handle Stripe webhook events

## 7. Database Schema

### 7.1 User Profile (Firebase)

```typescript
interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  stripeCustomerId?: string;        // Stripe customer ID
  defaultPaymentMethodId?: string;  // Default payment method ID
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryZipCode?: string;
  deliveryState?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### 7.2 Order (Firebase)

```typescript
interface Order {
  id?: string;
  items: OrderItem[];
  deliveryDate: string;
  address: string;
  city: string;
  zipCode: string;
  customerName: string;
  email: string;
  phone: string;
  comments: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt?: Date;
  userId?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly';
  recurringStartDate?: string;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
}
```

## 8. User Flow

### 8.1 Adding Payment Method

1. User clicks "Add Payment Method" in dashboard
2. System checks if user has Stripe customer
3. If not, creates Stripe customer automatically
4. Creates setup intent for payment method addition
5. User enters card details using Stripe Elements
6. Card is saved to Stripe customer
7. User is redirected back to payment methods page
8. Success message is displayed

### 8.2 Using Payment Method

1. User places order
2. System checks for saved payment methods
3. If available, offers to use saved method
4. If not, redirects to payment form
5. Payment is processed using Stripe
6. Order is saved to Firebase
7. Success confirmation is shown

## 9. Error Handling

### 9.1 Common Errors

- **Card Declined**: Display user-friendly error message
- **Invalid Card**: Show validation errors from Stripe
- **Network Issues**: Retry mechanism for failed requests
- **Webhook Failures**: Log errors for manual review

### 9.2 User Feedback

- Loading states during payment processing
- Success messages for completed actions
- Error messages with actionable guidance
- Confirmation dialogs for destructive actions

## 10. Testing

### 10.1 Test Cards

Use these test card numbers for development:

| Card Type | Number | CVC | Expiry |
|-----------|--------|-----|--------|
| Visa | 4242424242424242 | Any 3 digits | Any future date |
| Visa (debit) | 4000056655665556 | Any 3 digits | Any future date |
| Mastercard | 5555555555554444 | Any 3 digits | Any future date |
| American Express | 378282246310005 | Any 4 digits | Any future date |
| Declined | 4000000000000002 | Any 3 digits | Any future date |

### 10.2 Test Scenarios

1. **Successful Payment Method Addition**
2. **Failed Payment Method Addition** (use declined card)
3. **Payment Method Deletion**
4. **Default Payment Method Setting**
5. **Order Processing with Saved Method**
6. **Recurring Order Setup**

## 11. Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint URL
- [ ] Test all payment flows with real cards
- [ ] Set up proper error monitoring
- [ ] Configure webhook retry logic
- [ ] Set up Stripe Dashboard alerts
- [ ] Review and update security rules
- [ ] Test webhook signature verification

## 12. Troubleshooting

### 12.1 Payment Method Not Saving

- Check Stripe customer creation
- Verify webhook endpoint is working
- Check browser console for errors
- Verify environment variables are set

### 12.2 Webhook Not Receiving Events

- Check webhook endpoint URL
- Verify webhook secret is correct
- Check server logs for errors
- Test webhook endpoint manually

### 12.3 Stripe Elements Not Loading

- Verify publishable key is set
- Check for JavaScript errors
- Ensure Stripe.js is loaded
- Verify client secret is valid

## 13. Security Best Practices

1. **Never log card data** - Only log payment method IDs
2. **Verify webhook signatures** - Always verify Stripe webhook signatures
3. **Use HTTPS** - Always use HTTPS in production
4. **Validate user permissions** - Ensure users can only access their own data
5. **Monitor for suspicious activity** - Set up alerts for unusual payment patterns
6. **Keep dependencies updated** - Regularly update Stripe SDK versions 