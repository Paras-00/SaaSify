import { AlertCircle, CheckCircle, Eye, EyeOff, KeyRound, Loader2, Lock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

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
      await authService.resetPassword(token, formData.password);
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);

      // Handle token expiration
      if (error.response?.status === 400 || error.response?.data?.code === 'INVALID_TOKEN') {
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2000);
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

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    if (strength < 100) return 'Strong';
    return 'Very Strong';
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains number', met: /[0-9]/.test(formData.password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(formData.password) },
  ];

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
                <Shield className="text-brand-green" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-serif font-medium text-brand-text-primary">Reset Password</h1>
                <p className="text-sm text-brand-text-secondary">Create a new secure password</p>
              </div>
            </div>
          </div>

          {/* Form content */}
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <KeyRound className="text-brand-green" size={24} />
                <h2 className="text-2xl font-serif font-medium text-brand-text-primary">Set New Password</h2>
              </div>
              <p className="text-brand-text-secondary">
                Enter a strong password below. Make sure it's different from your previous passwords.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold text-brand-text-primary uppercase tracking-wider">
                    New Password
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${passwordStrength < 50 ? 'bg-red-500/10 text-red-500' :
                    passwordStrength < 75 ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-brand-green/10 text-brand-green'
                    }`}>
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-11 pr-12 border rounded-lg focus:outline-none focus:ring-1 transition-all bg-brand-gray/5 placeholder:text-brand-text-secondary/50 ${errors.password
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-brand-green focus:border-brand-green'
                      } text-brand-text-primary`}
                    placeholder="Create a strong password"
                  />
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-500' : 'text-brand-text-secondary'
                    }`} size={20} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary transition-colors p-1 rounded hover:bg-brand-gray/5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="h-1 bg-brand-gray/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>

                    {/* Password requirements */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          {req.met ? (
                            <CheckCircle className="text-brand-green" size={14} />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                          )}
                          <span className={`text-xs ${req.met ? 'text-brand-green' : 'text-brand-text-secondary'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-brand-text-primary mb-2 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-11 pr-12 border rounded-lg focus:outline-none focus:ring-1 transition-all bg-brand-gray/5 placeholder:text-brand-text-secondary/50 ${errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                        ? 'border-brand-green focus:ring-brand-green focus:border-brand-green'
                        : 'border-gray-300 focus:ring-brand-green focus:border-brand-green'
                      } text-brand-text-primary`}
                    placeholder="Re-enter your new password"
                  />
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.confirmPassword ? 'text-red-500' :
                    formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-brand-green' : 'text-brand-text-secondary'
                    }`} size={20} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary transition-colors p-1 rounded hover:bg-brand-gray/5"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.confirmPassword}
                  </p>
                ) : formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-sm text-brand-green flex items-center gap-1">
                    <CheckCircle size={14} />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Password Tips */}
              <div className="bg-brand-gray/5 border border-brand-gray/10 rounded-lg p-4">
                <h3 className="font-semibold text-brand-text-primary mb-2 flex items-center gap-2">
                  <Shield size={16} />
                  Security Tips:
                </h3>
                <ul className="text-sm text-brand-text-secondary space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-green mt-0.5">•</span>
                    Use a combination of letters, numbers, and symbols
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-green mt-0.5">•</span>
                    Avoid using personal information or common words
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-green mt-0.5">•</span>
                    Consider using a password manager for security
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green text-white py-3.5 rounded-full font-bold hover:bg-brand-green-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transform active:scale-[0.98]"              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Updating Password...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-8 pt-6 border-t border-brand-gray/10 text-center">
              <p className="text-sm text-brand-text-secondary">
                Remember your password?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-brand-green hover:underline font-medium"
                >
                  Sign in instead
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-brand-green/10 p-2 rounded-lg border border-brand-green/20">
              <Shield className="text-brand-green" size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand-text-primary mb-1">Secure Password Reset</h4>
              <p className="text-xs text-brand-text-secondary">
                Your password will be encrypted using industry-standard security.
                This link will expire after use for your protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}