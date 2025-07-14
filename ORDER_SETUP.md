# Order System Setup Guide

This guide will help you set up the order system with Stripe payment integration.

## Features Implemented

✅ **Bread Selection**: Customers can choose from 4 bread types:
- Classic Salt ($8.99)
- Rosemary ($9.99) 
- Green Olive ($10.99)
- Cheez-it ($11.99)

✅ **Quantity Selection**: Customers can select quantity with +/- buttons

✅ **Address Validation**: Only Multnomah County (Portland area) ZIP codes are accepted

✅ **Stripe Payment**: Credit card processing using Stripe Payment Element

✅ **Order Flow**: Complete order → Payment → Success confirmation

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Stripe Setup Instructions

### 1. Create a Stripe Account
- Go to [stripe.com](https://stripe.com) and create an account
- Complete the account setup process

### 2. Get Your API Keys
- In your Stripe Dashboard, go to Developers → API keys
- Copy your Publishable key and Secret key
- Add them to your `.env.local` file

### 3. Set Up Webhooks (Optional but Recommended)
- In your Stripe Dashboard, go to Developers → Webhooks
- Click "Add endpoint"
- Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
- Select these events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Copy the webhook signing secret and add it to your `.env.local` file

### 4. Test the Integration
- Use Stripe's test card numbers for testing:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - Expiry: Any future date
  - CVC: Any 3 digits

## Multnomah County ZIP Codes

The system validates delivery addresses against these Portland area ZIP codes:
- 97201-97240, 97242, 97266-97269, 97280-97283, 97286, 97290-97294, 97296, 97298-97299

## File Structure

```
src/
├── app/
│   ├── order/
│   │   ├── page.tsx              # Main order form
│   │   ├── payment/
│   │   │   └── page.tsx          # Payment page with Stripe Elements
│   │   └── success/
│   │       └── page.tsx          # Order confirmation page
│   └── api/
│       └── stripe/
│           ├── create-payment-intent/
│           │   └── route.ts      # Creates Stripe payment intents
│           └── webhook/
│               └── route.ts      # Handles Stripe webhooks
└── components/
    └── Header.tsx                # Updated with "Order" menu item
```

## Usage Flow

1. **Customer visits `/order`**
   - Selects bread type and quantity
   - Fills in customer information
   - Enters delivery address (validated for Multnomah County)
   - Reviews order summary

2. **Customer clicks "Proceed to Payment"**
   - Order details are sent to create payment intent
   - Customer is redirected to `/order/payment`

3. **Customer completes payment**
   - Stripe Payment Element handles credit card input
   - Payment is processed securely
   - Customer is redirected to `/order/success` on success

4. **Order confirmation**
   - Success page shows order details
   - Order details are cleared from session storage
   - Customer can place another order or return home

## Customization

### Adding New Bread Types
Edit the `BREAD_TYPES` array in `src/app/order/page.tsx`:

```typescript
const BREAD_TYPES = [
  { id: 'new-bread', name: 'New Bread', price: 12.99, description: 'Description here' },
  // ... existing bread types
];
```

### Modifying Delivery Areas
Update the `multnomahZipCodes` array in the validation function to include different ZIP codes.

### Styling
The order pages use Tailwind CSS classes. You can customize the styling by modifying the className attributes.

## Security Notes

- All payment processing is handled securely by Stripe
- No credit card data is stored on your server
- Address validation prevents orders outside delivery area
- Webhook signature verification ensures webhook authenticity

## Troubleshooting

### Payment Intent Creation Fails
- Check that your Stripe secret key is correct
- Ensure the amount is at least 50 cents
- Verify all required order details are provided

### Webhook Issues
- Ensure webhook endpoint is publicly accessible
- Check webhook signature secret is correct
- Verify webhook events are properly configured in Stripe Dashboard

### Address Validation Issues
- Confirm ZIP code is in the allowed list
- Check that city field is not empty
- Ensure address format is valid

## Next Steps

Consider implementing these additional features:
- Email notifications for order confirmations
- Order tracking system
- Customer account management
- Inventory management
- Delivery scheduling
- Order history
- Customer reviews and ratings 