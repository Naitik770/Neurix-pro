import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function Billing() {
  const { user, profile, isPro, remainingDays } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifyingStripe, setVerifyingStripe] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const planText = useMemo(() => isPro ? `PRO (${remainingDays} day${remainingDays === 1 ? '' : 's'} left)` : 'FREE', [isPro, remainingDays]);

  useEffect(() => {
    const verifyStripeReturn = async () => {
      if (!user) return;
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const sessionId = params.get('session_id');
      if (status !== 'success' || !sessionId || isPro) return;

      setVerifyingStripe(true);
      setStatusMessage('Verifying Stripe payment…');
      try {
        const verify = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gateway: 'stripe',
            userId: user.uid,
            stripeSessionId: sessionId
          })
        });
        if (!verify.ok) {
          const err = await verify.json().catch(() => ({}));
          throw new Error(err.error || 'Stripe verification failed');
        }
        confetti({ particleCount: 110, spread: 70, origin: { y: 0.6 } });
        toast.success('Stripe payment verified. Pro activated!');
        setStatusMessage('Payment verified. Your PRO plan is active.');
        params.delete('session_id');
        params.delete('status');
        const next = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`);
        window.location.reload();
      } catch (error: any) {
        toast.error(error.message || 'Unable to verify Stripe payment');
        setStatusMessage(error.message || 'Unable to verify Stripe payment.');
      } finally {
        setVerifyingStripe(false);
      }
    };
    verifyStripeReturn();
  }, [user, isPro]);

  const loadRazorpayScript = async () => {
    if (window.Razorpay) return true;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return new Promise<boolean>((resolve) => {
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
    });
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    setStatusMessage('Preparing Razorpay checkout…');
    try {
      const orderResp = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, currency: 'INR', gateway: 'razorpay' })
      });
      if (!orderResp.ok) {
        const err = await orderResp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create order');
      }
      const order = await orderResp.json();

      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) throw new Error('Razorpay SDK failed to load');

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'NEURIX',
        description: 'NEURIX Pro Plan',
        order_id: order.orderId,
        handler: async (response: any) => {
          const verify = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gateway: 'razorpay',
              userId: user.uid,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            })
          });
          if (!verify.ok) {
            const err = await verify.json().catch(() => ({}));
            toast.error(err.error || 'Payment verification failed.');
            setStatusMessage(err.error || 'Payment verification failed.');
            return;
          }
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 } });
          toast.success('Pro activated successfully!');
          setStatusMessage('Payment verified. Your PRO plan is active.');
          window.location.reload();
        },
        prefill: { email: profile?.email || user.email || '' },
        theme: { color: '#f97316' }
      };

      const razor = new window.Razorpay(options);
      razor.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setStatusMessage('Payment failed. Please try again.');
      });
      razor.open();
    } catch (error: any) {
      toast.error(error.message || 'Unable to start checkout');
      setStatusMessage(error.message || 'Unable to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!user) return;
    setLoading(true);
    setStatusMessage('Creating Stripe checkout session…');
    try {
      const resp = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, currency: 'USD', gateway: 'stripe' })
      });
      const data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || 'Stripe session could not be created');
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || 'Stripe checkout failed');
      setStatusMessage(error.message || 'Stripe checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-5 py-8 bg-[#080d1a] text-white">
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-3xl font-bold">Manage Subscription</h1>
        {statusMessage && (
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-gray-100">
            {statusMessage}
          </div>
        )}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-gray-300">Current Plan</p>
          <p className="text-2xl font-semibold mt-1">{planText}</p>
          {!isPro && <p className="text-sm text-gray-400 mt-3">Free plan includes 10 AI messages/day and 5MB upload limit.</p>}
          {isPro && <p className="text-sm text-green-300 mt-3">Unlimited AI and premium features are unlocked.</p>}
        </div>

        <div className="rounded-3xl border border-orange-500/40 bg-orange-500/10 p-6">
          <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
          <p className="text-gray-200 mt-2">Pay ₹99/month in India (UPI/Cards/Netbanking) or $1/month globally.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={handleUpgrade} disabled={loading || isPro || verifyingStripe} className="px-5 py-3 rounded-xl bg-orange-500 disabled:opacity-50">{loading ? 'Processing...' : 'Pay with Razorpay'}</button>
            <button onClick={handleStripeCheckout} disabled={loading || isPro || verifyingStripe} className="px-5 py-3 rounded-xl border border-white/20 bg-white/10 disabled:opacity-50">{verifyingStripe ? 'Verifying...' : 'Pay with Stripe'}</button>
          </div>
        </div>

        <div className="text-sm text-gray-400">Need plan details? <Link to="/pricing" className="text-orange-400">View pricing</Link></div>
      </div>
    </div>
  );
}
