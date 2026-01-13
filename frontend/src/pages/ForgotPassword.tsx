// ============================================
// FORGOT PASSWORD PAGE
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, KeyRound, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Kavachlogo from '@/assets/KavachLogo.png';
import Instance from '@/lib/axiosInstance';
import { AnimatedBackground, GlassCard } from '@/components/common';
import { FormInput, FormOTPInput, FormButton, FormAlert } from '@/components/form';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      const response = await Instance.post('/forgot-password', { email });
      setIsLoading(false);
      setSuccessMsg(response.data.message || `OTP sent to ${email}`);

      setTimeout(() => {
        setStep('otp');
        setSuccessMsg('');
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      if (err.response?.status === 404) {
        setError('This email is not registered with us.');
      } else {
        setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    try {
      setIsLoading(true);
      await Instance.put('/verify-otp', { email, otp });
      setIsLoading(false);
      navigate('/reset-password', { state: { email, verified: true } });
    } catch (err: any) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden font-sans selection:bg-orange-200 selection:text-orange-900">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 px-2"
      >
        <GlassCard className="p-8 md:p-10">
          {/* Logo & Icon */}
          <div className="flex flex-col items-center justify-center mb-8 relative">
            <img
              src={Kavachlogo}
              alt="Kavach Logo"
              className="h-16 w-auto object-contain mb-6 drop-shadow-sm"
            />

            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 rounded-full animate-pulse" />
              <div className="relative w-20 h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10 group hover:scale-105 transition-transform">
                <KeyRound
                  className="w-10 h-10 text-orange-500 group-hover:rotate-12 transition-transform duration-300"
                  strokeWidth={1.5}
                />
              </div>
              <motion.div
                className="absolute -right-2 -bottom-2 bg-blue-100 p-1.5 rounded-full border border-white shadow-sm"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Mail size={14} className="text-blue-600" />
              </motion.div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              {step === 'email' ? 'Forgot Password?' : 'Enter OTP'}
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              {step === 'email'
                ? 'Enter your registered email to receive a code.'
                : `We sent a code to ${email}`}
            </p>
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP}
                className="space-y-6"
              >
                <FormInput
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="name@company.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                />

                {error && <FormAlert type="error" message={error} />}
                {successMsg && <FormAlert type="success" message={successMsg} />}

                <FormButton
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Sending..."
                  icon={Send}
                  variant="secondary"
                  fullWidth
                >
                  Send OTP
                </FormButton>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <FormOTPInput
                    id="otp"
                    label="One-Time Password"
                    length={6}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      setError('');
                    }}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError('');
                        setOtp('');
                      }}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      Change Email?
                    </button>
                  </div>
                </div>

                {error && <FormAlert type="error" message={error} />}

                <FormButton
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Verifying..."
                  variant="secondary"
                  fullWidth
                >
                  Verify & Proceed
                </FormButton>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Back Link */}
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 transition-colors text-sm font-bold group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
              to Login
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
