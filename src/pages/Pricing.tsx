import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0b1020] text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center">Choose your NEURIX plan</h1>
        <p className="text-center text-gray-300 mt-3">Start free, upgrade anytime with Razorpay (India) or Stripe (Global).</p>
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">Free</h2>
            <p className="text-3xl font-bold mt-2">₹0</p>
            <ul className="mt-5 space-y-2 text-gray-200 text-sm">
              {['10 AI messages/day', 'Basic chat & history', '5MB uploads'].map((f) => <li key={f} className="flex gap-2"><CheckCircle2 className="w-4 text-green-400" />{f}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl border border-orange-400/50 bg-orange-500/10 p-6">
            <h2 className="text-2xl font-semibold">Pro</h2>
            <p className="text-3xl font-bold mt-2">$1 / ₹99</p>
            <ul className="mt-5 space-y-2 text-gray-100 text-sm">
              {['Unlimited AI usage', 'Full messaging features', '100MB uploads', 'Priority responses', 'Premium UI perks'].map((f) => <li key={f} className="flex gap-2"><CheckCircle2 className="w-4 text-green-300" />{f}</li>)}
            </ul>
            <Link to="/billing" className="inline-block mt-6 px-5 py-3 rounded-xl bg-orange-500 font-semibold">Upgrade to Pro</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
