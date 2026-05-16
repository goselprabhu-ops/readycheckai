import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useServerFn } from '@tanstack/react-start';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import { createCheckoutSession } from '@/lib/payments.functions';

interface Props {
  priceId: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckoutPanel({ priceId, returnUrl }: Props) {
  const create = useServerFn(createCheckoutSession);
  const fetchClientSecret = async (): Promise<string> => {
    const res = await create({
      data: {
        priceId,
        returnUrl: returnUrl || `${window.location.origin}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if (!res.clientSecret) throw new Error('No client secret returned');
    return res.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
