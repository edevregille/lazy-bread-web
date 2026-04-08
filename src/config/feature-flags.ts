/**
 * Client-side feature flags (NEXT_PUBLIC_* are inlined at build time).
 *
 * Subscription / recurring orders: enabled only when NEXT_PUBLIC_ENABLE_SUBSCRIPTION === "true".
 * Unset, empty, or any other value means disabled (default).
 */
export const isSubscriptionEnabled =
  process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTION === 'true';
