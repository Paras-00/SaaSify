import { ArrowLeft, CheckCircle, Key, Loader2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(0);

  // Countdown timer for resend email
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      toast.success('Password reset link sent to your email!');
      setSubmitted(true);
      setTimer(60); // Start 60-second timer
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to send reset link';
      toast.error(errorMessage);

      if (error.response?.data?.field === 'email') {
        setErrors({ email: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (timer > 0) return;

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('Reset link re-sent to your email!');
      setTimer(60); // Restart timer
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to re-send reset link';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black p-4 font-sans">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-serif text-brand-text-primary">SaaSify</span>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-green/20">
              <CheckCircle className="text-brand-green" size={40} />
            </div>

            <h2 className="text-2xl font-serif font-medium text-brand-text-primary mb-3">Check Your Email</h2>
            <p className="text-brand-text-secondary text-sm mb-2">
              We've sent a password reset link to:
            </p>
            <p className="font-semibold text-brand-text-primary mb-6 text-sm break-all">{email}</p>

            {/* Steps */}
            <div className="text-left bg-brand-black/30 border border-brand-gray/20 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-brand-text-primary mb-3 flex items-center gap-2 text-sm">
                <Mail size={15} className="text-brand-green" /> What to do next:
              </h3>
              <ul className="text-sm text-brand-text-secondary space-y-2">
                <li className="flex items-start gap-2"><span className="text-brand-green mt-0.5">✓</span> Check your inbox for an email from us</li>
                <li className="flex items-start gap-2"><span className="text-brand-green mt-0.5">✓</span> Click the reset link in the email</li>
                <li className="flex items-start gap-2"><span className="text-brand-green mt-0.5">✓</span> Create a new password for your account</li>
              </ul>
            </div>

            {/* Resend */}
            <button
              onClick={handleResendEmail}
              disabled={timer > 0 || loading}
              className="w-full py-3 rounded-xl border-2 border-brand-green text-brand-green font-semibold hover:bg-brand-green hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? 'Sending…' : timer > 0 ? `Resend in ${timer}s` : 'Resend Reset Link'}
            </button>

            <p className="text-sm text-brand-text-secondary mb-3">Didn't receive it? Check your spam folder.</p>

            <Link
              to="/login"
              className="text-sm text-brand-text-secondary hover:text-brand-green transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-black p-4 font-sans">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-2xl font-serif text-brand-text-primary">SaaSify</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-brand-gray/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center border border-brand-green/20">
                <Key className="text-brand-green" size={20} />
              </div>
              <h1 className="text-2xl font-serif font-medium text-brand-text-primary">Reset Password</h1>
            </div>
          </div>

          {/* Form content */}
          <div className="p-8">
            {/* Back button */}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-brand-green font-medium mb-6 group transition-colors"
            >
              <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
              Back to Login
            </Link>

            <div className="mb-6">
              <h2 className="text-2xl font-serif font-medium text-brand-text-primary mb-2">Forgot your password?</h2>
              <p className="text-brand-text-secondary">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-brand-text-primary mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({});
                    }}
                    className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-1 transition-all bg-brand-gray/5 placeholder:text-brand-text-secondary/50 ${errors.email
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-brand-green focus:border-brand-green'
                      } text-brand-text-primary`}
                    placeholder="you@example.com"
                  />
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-500' : 'text-brand-text-secondary'
                    }`} size={20} />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green text-white py-3.5 rounded-full font-bold hover:bg-brand-green-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transform active:scale-[0.98]"              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Sending Reset Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-brand-gray/10">
              <div className="bg-brand-gray/5 rounded-lg p-4 border border-brand-gray/10">
                <h3 className="font-semibold text-brand-text-primary mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Need help?
                </h3>
                <p className="text-sm text-brand-text-secondary">
                  If you're having trouble resetting your password, please contact our{' '}
                  <Link to="/support" className="text-brand-green hover:underline font-medium">
                    support team
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Alternative Options */}
            <div className="mt-6 text-center">
              <p className="text-sm text-brand-text-secondary">
                Remember your password?{' '}
                <Link to="/login" className="text-brand-green hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-brand-text-secondary">
            We'll send you a secure link to reset your password. The link expires in 1 hour.
          </p>
        </div>
      </div>
    </div>
  );
}