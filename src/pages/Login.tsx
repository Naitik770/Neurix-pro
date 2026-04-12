import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, loginWithEmail } from '../firebase';
import { toast } from 'sonner';
import { Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await loginWithEmail(email, password);
      if (!userCredential.user.emailVerified) {
        toast.info('Please verify your email to continue.');
        navigate('/verify-email');
        return;
      }
      toast.success('Welcome back to NEURIX!');
      navigate('/app');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        toast.error('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(err.message || 'Failed to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
      navigate('/app');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="min-h-screen grid lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between p-10 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,.25),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,.16),transparent_40%)]">
          <div className="flex items-center gap-2 text-orange-300 font-semibold text-xl">
            <Sparkles className="w-5 h-5" /> NEURIX
          </div>
          <div>
            <h1 className="text-5xl font-bold leading-tight">AI-powered messaging & productivity platform</h1>
            <p className="mt-4 text-gray-300 max-w-md">Collaborate, chat, and scale with a premium SaaS experience made for modern teams.</p>
            <div className="mt-8 space-y-3 text-sm text-gray-200">
              <p className="flex items-center gap-2"><ShieldCheck className="w-4 text-green-400" /> Secure authentication + subscription controls</p>
              <p className="flex items-center gap-2"><Zap className="w-4 text-orange-300" /> Fast, responsive and mobile-first UI</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} NEURIX</p>
        </section>

        <section className="flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-7 shadow-2xl shadow-black/30">
            <h2 className="text-3xl font-bold">Sign in</h2>
            <p className="text-gray-300 mt-1">Continue to your NEURIX workspace</p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs text-gray-300 mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/25 bg-white/5 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs text-gray-300 mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/25 bg-white/5 px-4 py-3 outline-none focus:border-orange-400"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-orange-500 py-3 font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-orange-400 transition-colors">
                {loading && <Loader2 className="w-4 animate-spin" />} Sign In
              </button>
            </form>

            <button onClick={handleGoogleLogin} disabled={loading} className="mt-4 w-full rounded-2xl border border-white/25 bg-white/5 py-3 font-semibold hover:bg-white/10 transition-colors disabled:opacity-60">
              Continue with Google
            </button>

            <div className="mt-5 text-sm text-gray-300 flex justify-between">
              <Link to="/forgot-password" className="hover:text-white">Forgot Password?</Link>
              <Link to="/signup" className="text-orange-300 hover:text-orange-200">Create account</Link>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
