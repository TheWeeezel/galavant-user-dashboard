/**
 * Who sells. The Terms of Sale and the Refund Policy both name the seller, so they read it from here
 * and cannot disagree. Galavant is run privately for now (owner, 2026-10-08): the pages show the
 * name, the country and the contact email, nothing more. Card purchases are sold through Link,
 * Stripe's merchant of record, which carries the seller duties for those payments.
 */
export const SELLER = {
  name: 'Galavant',
  country: 'Switzerland',
  email: 'we@galavant.run',
} as const;

/** The date both pages show; change it whenever either page changes. */
export const LEGAL_UPDATED = 'October 8, 2026';
