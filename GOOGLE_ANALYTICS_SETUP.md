# Google Analytics Setup

This project includes Google Analytics 4 (GA4) integration with environment variable configuration for easy switching between test and production environments.

## Setup Instructions

### 1. Create Google Analytics Properties

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create two properties:
   - **Test Property**: For development and testing
   - **Production Property**: For live website

### 2. Get Measurement IDs

For each property, get the Measurement ID (format: `G-XXXXXXXXXX`)

### 3. Environment Configuration

Create the following environment files:

#### `.env.local` (for development)
```bash
# Google Analytics - Test Property
NEXT_PUBLIC_GA_ID=G-TESTPROPERTYID

# Other environment variables...
```

#### `.env.production` (for production)
```bash
# Google Analytics - Production Property
NEXT_PUBLIC_GA_ID=G-PRODUCTIONPROPERTYID

# Other environment variables...
```

### 4. Usage in Components

The Google Analytics functions are available in `src/lib/gtag.ts`:

```typescript
import { trackSignup, trackOrder, trackSubscriptionAction } from '@/lib/gtag';

// Track user signup
trackSignup('email');

// Track order placement
trackOrder(25.99, 'single');

// Track subscription actions
trackSubscriptionAction('pause');
```

### 5. Available Tracking Functions

- `trackSignup(method: string)` - Track user registration
- `trackOrder(value: number, type: 'single' | 'subscription')` - Track purchases
- `trackSubscriptionAction(action: 'pause' | 'resume' | 'cancel')` - Track subscription changes
- `trackPaymentAction(action: 'add' | 'remove' | 'update')` - Track payment method changes

### 6. Automatic Page Tracking

Page views are automatically tracked when users navigate between pages.

### 7. Testing

- **Development**: Uses test property ID
- **Production**: Uses production property ID
- **Local**: No tracking if `NEXT_PUBLIC_GA_ID` is not set

### 8. Privacy Considerations

- Google Analytics respects user privacy settings
- Consider adding a cookie consent banner for GDPR compliance
- Data is automatically anonymized by GA4

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 Measurement ID | `G-XXXXXXXXXX` |

## Files Modified

- `src/lib/gtag.ts` - Google Analytics configuration and tracking functions
- `src/components/GoogleAnalytics.tsx` - GA script loader component
- `src/app/layout.tsx` - Added GA component to root layout 