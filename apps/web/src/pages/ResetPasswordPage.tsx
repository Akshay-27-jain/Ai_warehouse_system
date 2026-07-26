import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../lib/api';
import AuthInput from '../components/ui/AuthInput';
import AuthButton from '../components/ui/AuthButton';
import { smoothTransition } from '../animations/variants';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e?.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token, password });
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#040b17] to-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-10%] top-[-10%] h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-8%] right-[-6%] h-72 w-72 rounded-full bg-sky-500/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={smoothTransition}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_30px_90px_rgba(2,8,23,0.65)] backdrop-blur-2xl"
      >
        <div className="border-b border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-900/80 to-slate-950 px-6 py-8 sm:px-8">
          <div className="mb-5 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/25">
              <ShieldCheck size={22} />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Reset your password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Enter the reset token from your email and create a new password.</p>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <AuthInput
              label="Reset Token"
              name="token"
              type="text"
              placeholder="Paste your reset token here"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              icon={ShieldCheck}
              autoComplete="off"
              required
            />
            <AuthInput
              label="New Password"
              name="password"
              type="password"
              placeholder="Enter a new strong password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={Lock}
              autoComplete="new-password"
              togglePassword
              required
            />

            {error && (
              <p role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {success && (
              <p role="status" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            )}

            <AuthButton type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </AuthButton>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-5 py-3.5 text-base font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800"
            >
              <ArrowLeft size={18} />
              Back to Login
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

