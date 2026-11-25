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

/**
 * Who runs Galavant (owner, 2026-11-25): a sole proprietorship under the trade name Vedea Ventures,
 * which also runs Wellz and Adventsaga. Not a registered company, not in the commercial register.
 * The imprint, the terms and the privacy policy name it; Galavant keeps its own support email.
 */
export const OPERATOR = {
  name: 'Dominik Richner, trading as Vedea Ventures',
  country: 'Switzerland',
  url: 'https://vedea.ch',
} as const;

/** The date the Terms of Sale, Refund Policy and Privacy Policy show; change it whenever one of them changes. */
export const LEGAL_UPDATED = 'November 25, 2026';
