import { ChevronLeft, LayoutDashboard, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function VerifyLogin2FA() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    const email = location.state?.email;

    useEffect(() => {
        // If no email in state, redirect back to login
        if (!email) {
            toast.error('Session expired. Please log in again.');
            navigate('/login');
        }

        // Focus first input on mount
        if (inputRefs[0].current) {
            inputRefs[0].current.focus();
        }
    }, [email, navigate]);

    const handleChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input on backspace if current is empty
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').substring(0, 6).split('');
        const newCode = [...code];

        pastedData.forEach((char, index) => {
            if (index < 6 && /^\d$/.test(char)) {
                newCode[index] = char;
            }
        });

        setCode(newCode);

        // Focus the last filled input or the first empty one
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs[nextIndex].current.focus();
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const verificationCode = code.join('');

        if (verificationCode.length !== 6) {
            toast.error('Please enter the 6-digit verification code');
            return;
        }

        if (!email) {
            toast.error('Session expired. Please log in again.');
            navigate('/login');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.verifyLogin2FA(email, verificationCode);

            // Handle remember me logic
            if (location.state?.rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            setUser(response.data.user);
            toast.success('Login successful!');
            navigate('/dashboard', { replace: true });
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Verification failed';
            toast.error(errorMessage);

            // Focus first input on failure and clear code
            setCode(['', '', '', '', '', '']);
            if (inputRefs[0].current) {
                inputRefs[0].current.focus();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 font-sans selection:bg-brand-green selection:text-white">
            <div className="w-full max-w-[480px] bg-brand-dark border border-brand-gray/10 rounded-3xl overflow-hidden shadow-2xl">

                {/* Header/Logo */}
                <div className="p-8 pb-0 text-center">
                    <Link to="/" className="inline-flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-brand-gray/5 border border-brand-gray/10 flex items-center justify-center">
                            <LayoutDashboard className="text-brand-green" size={20} />
                        </div>
                        <span className="text-xl font-medium text-brand-text-primary tracking-tight">SaaSify</span>
                    </Link>

                    <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="text-brand-green" size={32} />
                    </div>

                    <h2 className="text-2xl font-serif text-brand-text-primary mb-2">Two-Step Verification</h2>
                    <p className="text-brand-text-secondary text-sm px-4">
                        We've sent a 6-digit verification code to <span className="text-brand-text-primary font-medium">{email}</span>.
                        Enter it below to continue.
                    </p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Six-digit code input */}
                        <div className="flex justify-between gap-2 sm:gap-4">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={inputRefs[index]}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className="w-full h-14 sm:h-16 text-center bg-brand-gray/5 border border-brand-gray/10 rounded-xl text-xl sm:text-2xl font-bold text-brand-text-primary focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green transition-all"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.some(d => !d)}
                            className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-bold py-4 rounded-full transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-green/10"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Verify & Continue'}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-between text-xs sm:text-sm">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors duration-200"
                        >
                            <ChevronLeft size={16} />
                            Back to Sign In
                        </button>
                        <p className="text-brand-text-secondary">
                            Didn't receive code? <button className="text-brand-green font-semibold hover:underline">Resend</button>
                        </p>
                    </div>
                </div>

                {/* Footer info */}
                <div className="bg-brand-gray/5 p-6 text-center border-t border-brand-gray/5">
                    <p className="text-[10px] text-brand-text-secondary uppercase tracking-[0.2em] font-medium">
                        Enterprise Security Core • SOC2 Compliant
                    </p>
                </div>
            </div>
        </div>
    );
}
