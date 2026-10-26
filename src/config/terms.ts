/**
 * Version stamp for the published Terms of Sale (/terms).
 *
 * Stripe asks us to keep a record of each customer's agreement to the terms
 * that authorize charging their saved card after handoff, so this value is
 * stored with the order and sent to Stripe as setup intent metadata.
 *
 * Bump it whenever the terms change materially, so old orders stay tied to the
 * wording the customer actually agreed to.
 */
export const TERMS_VERSION = '2026-10-09';
