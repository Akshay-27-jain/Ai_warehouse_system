import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Sparkles, UserRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../lib/api';
import AuthInput from '../components/ui/AuthInput';
import AuthButton from '../components/ui/AuthButton';
import { smoothTransition } from '../animations/variants';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.register(form);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#040b17] to-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-10%] top-[-10%] h-56 w-56 rounded-full bg-violet-500/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-8%] right-[-6%] h-72 w-72 rounded-full bg-sky-500/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={smoothTransition}
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_30px_90px_rgba(2,8,23,0.65)] backdrop-blur-2xl"
      >
        <div className="border-b border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-900/80 to-slate-950 px-6 py-8 sm:px-8">
          <div className="mb-5 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/25">
              <Sparkles size={22} />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Start your operations workspace</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Launch a secure, beautiful home for inventory visibility, forecasting, and fulfillment planning.</p>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <AuthInput
                label="First Name"
                name="first_name"
                placeholder="First name"
                value={form.first_name}
                onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                icon={UserRound}
                autoComplete="given-name"
                required
              />
              <AuthInput
                label="Last Name"
                name="last_name"
                placeholder="Last name"
                value={form.last_name}
                onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                icon={UserRound}
                autoComplete="family-name"
                required
              />
            </div>

            <AuthInput
              label="Username"
              name="username"
              placeholder="Choose a username"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              icon={UserRound}
              autoComplete="username"
              required
            />
            <AuthInput
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                  username: current.username ? current.username : event.target.value,
                }))
              }
              icon={Mail}
              autoComplete="email"
              required
            />
            <AuthInput
              label="Password"
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              icon={Lock}
              autoComplete="new-password"
              togglePassword
              required
            />

            {error && <p role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

            <AuthButton type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
              <ArrowRight size={18} />
            </AuthButton>

            <button
              type="button"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_URL || ''}/api/v1/auth/google/login`;
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-5 py-3.5 text-base font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-900">G</span>
              Continue with Google
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-sm text-slate-400">
            <span>Already have an account? </span>
            <Link className="font-semibold text-cyan-300 transition hover:text-cyan-200" to="/login">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}