import { Apple, Check, ChevronRight, LayoutDashboard, Loader2, Lock, Shield, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Load remembered email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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

    setLoading(true);

    try {
      const response = await authService.login(formData);

      if (response.data.require2FA) {
        toast.success(response.data.message || 'Verification code sent!');
        navigate('/verify-2fa', {
          state: {
            email: formData.email,
            rememberMe: rememberMe
          }
        });
        return;
      }

      setUser(response.data.user);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);

      if (error.response?.data?.field) {
        setErrors(prev => ({ ...prev, [error.response.data.field]: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 font-sans selection:bg-brand-green selection:text-white">
      {/* Centered Card Container */}
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden bg-brand-dark border border-brand-gray/10 shadow-2xl">

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
                <LayoutDashboard className="text-brand-green" size={20} />
              </div>
              <span className="text-xl font-medium text-brand-text-primary tracking-tight">SaaSify</span>
            </Link>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-lg mt-12">
            <h1 className="text-4xl font-serif font-medium text-brand-text-primary mb-6 leading-tight">
              Welcome back to the <br />
              <span className="italic text-brand-text-secondary">future of hosting</span>
            </h1>
            <p className="text-brand-text-secondary text-sm mb-8 leading-relaxed">
              Manage your infrastructure with precision. Our automated platform handles the complexity so you can focus on scaling.
            </p>

            <div className="space-y-4">
              <FeatureItem
                icon={<Check size={16} />}
                title="Real-time Analytics"
                desc="Monitor performance metrics instantly."
              />
              <FeatureItem
                icon={<Shield size={16} />}
                title="Enterprise Security"
                desc="SOC2 compliant infrastructure protection."
              />
              <FeatureItem
                icon={<Zap size={16} />}
                title="Auto-Scaling"
                desc="Resources adapt to your traffic demands."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-6 text-[10px] text-brand-text-secondary uppercase tracking-wider font-medium mt-12">
            <span>© 2026 SaaSify Inc.</span>
            <span className="w-1 h-1 rounded-full bg-brand-gray/20"></span>
            <Link to="/privacy" className="hover:text-brand-text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-brand-dark relative border-l border-brand-gray/5">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h2 className="text-2xl font-serif text-brand-text-primary mb-2">Sign In</h2>
              <p className="text-brand-text-secondary text-sm">Enter your credentials to access your dashboard.</p>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-gray/5 hover:bg-brand-gray/10 border border-brand-gray/10 rounded-lg text-brand-text-primary text-sm font-medium transition-all duration-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFF" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFF" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FFF" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#FFF" /></svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-gray/5 hover:bg-brand-gray/10 border border-brand-gray/10 rounded-lg text-brand-text-primary text-sm font-medium transition-all duration-200">
                <Apple size={16} className="fill-current" />
                Apple
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-gray/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-brand-dark px-2 text-brand-text-secondary">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-brand-text-primary mb-2 uppercase tracking-wider">Email</label>
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold text-brand-text-primary uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-xs text-brand-text-secondary hover:text-brand-green transition-colors">Forgot password?</Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-brand-gray/5 border ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-brand-green'} rounded-lg px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green transition-all`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-brand-gray/10 bg-brand-gray/5 text-brand-green focus:ring-brand-green/20"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-brand-text-secondary">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-bold py-3.5 rounded-full transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-sm"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-brand-text-secondary">
              Not a member? <Link to="/register" className="text-brand-green font-semibold hover:underline">Start a 14 day free trial</Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-brand-gray/5 border border-brand-gray/10 flex items-center justify-center text-brand-text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-brand-text-primary font-serif font-medium">{title}</h3>
        <p className="text-sm text-brand-text-secondary">{desc}</p>
      </div>
    </div>
  )
}