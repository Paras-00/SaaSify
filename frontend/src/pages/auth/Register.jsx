import { AlertCircle, Check, CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, RefreshCw, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return Math.min(score, 100);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await authService.resendVerificationEmail(registeredEmail);
      toast.success('Verification email resent!');
      setResendCooldown(60);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to resend email';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setRegisteredEmail(formData.email.trim());
      setEmailSent(true);
      toast.success('Account created! Please verify your email.');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      if (error.response?.data?.field) {
        setErrors(prev => ({ ...prev, [error.response.data.field]: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 50) return 'bg-red-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };



  // ── Email Confirmation Screen (shown after successful registration) ──
  if (emailSent) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-serif text-brand-text-primary">SaaSify</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-green/20">
              <Mail className="h-9 w-9 text-brand-green" />
            </div>

            <h2 className="text-2xl font-serif font-medium text-brand-text-primary mb-3">
              Check your email
            </h2>
            <p className="text-brand-text-secondary text-sm leading-relaxed mb-2">
              We've sent a verification link to
            </p>
            <p className="font-semibold text-brand-text-primary mb-6 text-sm break-all">
              {registeredEmail}
            </p>
            <p className="text-brand-text-secondary text-sm leading-relaxed mb-8">
              Click the link in your email to verify your account. Once verified, you'll be guided through setting up two-factor authentication.
            </p>

            {/* Resend Button */}
            <button
              onClick={handleResendEmail}
              disabled={resendCooldown > 0 || resendLoading}
              className="w-full py-3 px-6 rounded-xl border-2 border-brand-green text-brand-green font-semibold hover:bg-brand-green hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
            >
              {resendLoading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
            </button>

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
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 font-sans selection:bg-brand-green selection:text-white">
      {/* Centered Card Container */}
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden bg-brand-dark border border-brand-gray/10 shadow-2xl h-[85vh] max-h-[800px]">

        {/* Left Column - Branding */}
        <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-brand-dark">
          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            {/* Background decoration removed */}
          </div>

          {/* Header */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-gray/5 border border-brand-gray/10 flex items-center justify-center">
                <span className="text-brand-green font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-medium text-brand-text-primary tracking-tight">SaaSify</span>
            </Link>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-lg mt-8">
            <h1 className="text-4xl font-serif font-medium text-brand-text-primary mb-6 leading-tight">
              Scale with <br />
              <span className="italic text-brand-text-secondary">precision</span>
            </h1>
            <p className="text-brand-text-secondary text-sm mb-10 leading-relaxed">
              Join the platform engineered for high-performance teams. Automate your infrastructure lifecycle.
            </p>

            <div className="bg-brand-gray/5 border-l-2 border-brand-green p-6 rounded-r-lg max-w-md">
              <p className="font-serif italic text-brand-text-primary/90 text-sm mb-4">"SaaSify transformed our deployment pipeline. We went from weekly releases to daily updates with zero downtime."</p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-6 text-[10px] text-brand-text-secondary uppercase tracking-wider font-medium">
            <span>© 2026 SaaSify Automation Inc.</span>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center min-h-0 bg-brand-dark relative border-l border-brand-gray/5">
          <div className="w-full h-full overflow-y-auto custom-scrollbar p-8 lg:p-12">
            <div className="max-w-[400px] mx-auto">
              <div className="mb-2 uppercase text-brand-green text-[10px] font-bold tracking-widest">Start Your Journey</div>
              <h2 className="text-2xl font-serif text-brand-text-primary mb-2">Create Account</h2>
              <p className="text-brand-text-secondary text-sm mb-8">Already a member? <Link to="/login" className="text-brand-green hover:underline">Log in</Link></p>

              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-[10px] uppercase font-bold text-brand-text-secondary mb-2 tracking-wider">Full Name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full bg-brand-gray/5 border ${errors.firstName ? 'border-red-500' : 'border-gray-300 focus:border-brand-green'} rounded-lg px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green transition-all`}
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-[10px] uppercase font-bold text-brand-text-secondary mb-2 tracking-wider opacity-0">Last Name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full bg-brand-gray/5 border ${errors.lastName ? 'border-red-500' : 'border-gray-300 focus:border-brand-green'} rounded-lg px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green transition-all`}
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-[10px] uppercase font-bold text-brand-text-secondary mb-2 tracking-wider">Work Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-brand-gray/5 border ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-brand-green'} rounded-lg px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green transition-all`}
                    placeholder="name@company.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-[10px] uppercase font-bold text-brand-text-secondary mb-2 tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full bg-brand-gray/5 border ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-brand-green'} rounded-lg px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green transition-all pr-12`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Strength Meter */}
                  {formData.password && (
                    <div className="mt-2 flex gap-1 h-1">
                      <div className={`flex-1 rounded-full transition-colors ${passwordStrength >= 25 ? getPasswordStrengthColor(passwordStrength) : 'bg-brand-gray/10'}`}></div>
                      <div className={`flex-1 rounded-full transition-colors ${passwordStrength >= 50 ? getPasswordStrengthColor(passwordStrength) : 'bg-brand-gray/10'}`}></div>
                      <div className={`flex-1 rounded-full transition-colors ${passwordStrength >= 75 ? getPasswordStrengthColor(passwordStrength) : 'bg-brand-gray/10'}`}></div>
                      <div className={`flex-1 rounded-full transition-colors ${passwordStrength >= 100 ? getPasswordStrengthColor(passwordStrength) : 'bg-brand-gray/10'}`}></div>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-[10px] uppercase font-bold text-brand-text-secondary mb-2 tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full bg-brand-gray/5 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-brand-green'} rounded-lg px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green transition-all pr-12`}
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                {/* Terms */}
                <div className="flex items-start pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    className="mt-1 w-3.5 h-3.5 rounded border-brand-gray/10 bg-brand-gray/5 text-brand-green focus:ring-brand-green/20"
                  />
                  <label htmlFor="terms" className="ml-3 block text-xs text-brand-text-secondary leading-relaxed">
                    I agree to receive product updates and engineering newsletters. By creating an account, you agree to our <Link to="/terms" className="text-brand-green hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-brand-green hover:underline">Privacy Policy</Link>.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-brand-green hover:bg-brand-green-hover text-white font-bold py-3.5 rounded-full transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Get Started <CheckCircle size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-6 group-hover:ml-0" />
                    </>
                  )}
                </button>

              </form>

              <div className="mt-10 pt-6 border-t border-brand-gray/10 flex justify-between text-[10px] text-brand-text-secondary">
                <Link to="/terms" className="hover:text-brand-text-primary">Terms of Service</Link>
                <Link to="/privacy" className="hover:text-brand-text-primary">Privacy Policy</Link>
                <Link to="/contact" className="hover:text-brand-text-primary">Need help? <span className="text-brand-text-primary">Contact Support</span></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}