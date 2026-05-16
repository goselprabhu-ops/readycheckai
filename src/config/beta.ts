/**
 * Beta mode — when true, the paywall is bypassed and all authenticated users
 * are treated as Premium. Subscription/Stripe code remains in place (dormant)
 * and will be re-enabled once Razorpay migration is complete post-beta.
 *
 * Flip this to `false` to re-enable paid subscriptions.
 */
export const BETA_MODE = true;

export const BETA_NOTICE = "Free during beta — all features unlocked while we test with our first users.";

/** Targets for triggering the post-beta paid migration (Razorpay). */
export const BETA_TARGET_USERS = 500;
export const BETA_TARGET_RESUMES = 500;