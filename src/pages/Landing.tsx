import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Bot, MessageCircleMore, ShieldCheck, Upload, Sparkles, CheckCircle2 } from 'lucide-react';

const features = [
  { icon: Bot, title: 'AI Chat Assistant', description: 'Smart coaching and productivity support with contextual responses.' },
  { icon: MessageCircleMore, title: 'Real-time Messaging', description: 'Lightning-fast private chats with online status and delivery indicators.' },
  { icon: Upload, title: 'File & Media Sharing', description: 'Share media, docs, and voice notes seamlessly across devices.' },
  { icon: ShieldCheck, title: 'Startup-grade Security', description: 'Verified auth, access control, and secure payment verification flows.' }
];

const testimonials = [
  { name: 'Aarav Mehta', role: 'Founder, PilotX', quote: 'NEURIX helped our remote team cut meeting time by 35% in two weeks.' },
  { name: 'Sophia Kim', role: 'Product Lead', quote: 'The premium experience is excellent — fast, elegant, and reliable on mobile.' },
  { name: 'Daniel Cruz', role: 'Freelancer', quote: 'I moved from three tools to one. Chat + AI assistant is the perfect workflow.' }
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#06080f] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.22),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.18),transparent_35%),linear-gradient(180deg,#06080f,#111827)]" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 md:py-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Sparkles className="text-orange-400" /><span className="text-xl font-semibold tracking-wide">NEURIX</span></div>
          <div className="flex gap-3">
            <Link to="/login" className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">Login</Link>
            <Link to="/signup" className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400">Get Started</Link>
          </div>
        </header>

        <section className="pt-16 md:pt-24 text-center">
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-bold leading-tight">
            AI-powered messaging & productivity platform
          </motion.h1>
          <p className="mt-5 text-gray-300 max-w-2xl mx-auto">NEURIX unifies chat, AI assistance, and collaboration into one premium workspace for modern teams.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="px-6 py-3 rounded-2xl bg-orange-500 font-semibold shadow-lg shadow-orange-500/30">Get Started</Link>
            <Link to="/app" className="px-6 py-3 rounded-2xl border border-white/30 bg-white/5">Try Demo</Link>
          </div>
        </section>

        <section className="mt-20 grid md:grid-cols-2 gap-5">
          {features.map((item) => (
            <motion.article key={item.title} whileHover={{ y: -4 }} className="rounded-3xl border border-white/15 bg-white/8 backdrop-blur-xl p-6">
              <item.icon className="text-orange-300 mb-4" />
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-gray-300 mt-2">{item.description}</p>
            </motion.article>
          ))}
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-semibold text-center">App Preview</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {['Smart Inbox', 'AI Coach Chat', 'Analytics Dashboard'].map((title, idx) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-gradient-to-b from-white/15 to-white/5 p-4">
                <div className="h-48 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-sm text-gray-300">
                  Screenshot {idx + 1}
                </div>
                <p className="mt-3 text-sm text-gray-200">{title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-semibold text-center">Pricing</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-white/20 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="text-gray-300 mt-1">₹0 / month</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">{['10 AI messages/day', 'Basic chat tools', '5MB uploads'].map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="w-4 text-green-400" />{x}</li>)}</ul>
            </div>
            <div className="rounded-3xl border border-orange-400/50 bg-orange-500/10 p-6">
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="text-gray-100 mt-1">$1 / ₹99 month</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-200">{['Unlimited AI chat', 'Full messaging + premium UI', '100MB uploads', 'Priority responses'].map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="w-4 text-green-300" />{x}</li>)}</ul>
              <Link to="/pricing" className="mt-5 inline-block px-4 py-2 rounded-xl bg-orange-500">View Plans</Link>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-semibold text-center">What users say</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white/8 border border-white/15 p-5">
                <p className="text-gray-200">“{t.quote}”</p>
                <p className="mt-4 font-medium">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-20 border-t border-white/10 pt-6 text-sm text-gray-400 flex flex-wrap gap-4 justify-between">
          <p>© {new Date().getFullYear()} NEURIX</p>
          <div className="flex gap-4"><a href="#">Privacy</a><a href="#">Contact</a><a href="#">Docs</a></div>
        </footer>
      </div>
    </main>
  );
}
