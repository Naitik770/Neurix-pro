import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, loginWithEmail } from '../firebase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const userCredential = await loginWithEmail(email, password);
      if (!userCredential.user.emailVerified) {
        toast.info('Please verify your email to continue.');
        navigate('/verify-email');
        return;
      }
      toast.success('Welcome back!');
      navigate('/app');
    } catch (err: any) {
      toast.error(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : (err.message || 'Failed to sign in'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome back!');
      navigate('/app');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') toast.error('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(249,115,22,.35),transparent_45%),#070b14] text-white flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-7">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-300 mt-1">Sign in to NEURIX</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="relative">
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="peer w-full rounded-2xl border border-white/25 bg-white/5 px-4 pt-6 pb-2 outline-none focus:border-orange-400" />
            <label htmlFor="email" className="absolute left-4 top-2 text-xs text-gray-300">Email</label>
          </div>
          <div className="relative">
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="peer w-full rounded-2xl border border-white/25 bg-white/5 px-4 pt-6 pb-2 outline-none focus:border-orange-400" />
            <label htmlFor="password" className="absolute left-4 top-2 text-xs text-gray-300">Password</label>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-orange-500 py-3 font-semibold disabled:opacity-60 flex items-center justify-center gap-2">{loading && <Loader2 className="w-4 animate-spin" />}Sign In</button>
        </form>

        <button onClick={handleGoogleLogin} disabled={loading} className="mt-4 w-full rounded-2xl border border-white/25 bg-white/5 py-3 font-semibold">Continue with Google</button>
        <div className="mt-5 text-sm text-gray-300 flex justify-between">
          <Link to="/forgot-password">Forgot Password?</Link>
          <Link to="/signup" className="text-orange-300">Create account</Link>
        </div>
      </motion.div>
    </div>
  );
}
