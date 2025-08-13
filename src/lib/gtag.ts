// Google Analytics configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_location?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
      }
    ) => void;
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID!, {
      page_location: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Custom event for user signup
export const trackSignup = (method: string) => {
  event({
    action: 'sign_up',
    category: 'engagement',
    label: method,
  });
};

// Custom event for order placement
export const trackOrder = (orderValue: number, orderType: 'single' | 'subscription') => {
  event({
    action: 'purchase',
    category: 'ecommerce',
    label: orderType,
    value: orderValue,
  });
};

// Custom event for subscription actions
export const trackSubscriptionAction = (action: 'pause' | 'resume' | 'cancel') => {
  event({
    action: action,
    category: 'subscription',
    label: action,
  });
};

// Custom event for payment method actions
export const trackPaymentAction = (action: 'add' | 'remove' | 'update') => {
  event({
    action: action,
    category: 'payment',
    label: action,
  });
}; 