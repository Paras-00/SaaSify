import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import { authService } from '../../services/authService';

export default function VerifyEmail() {
    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('');
    const location = useLocation();
    const verificationAttempted = useRef(false);

    useEffect(() => {
        const verify = async () => {
            if (verificationAttempted.current) return;
            verificationAttempted.current = true;

            const queryParams = new URLSearchParams(location.search);
            const token = queryParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('No verification token found. Please use the link from your email.');
                return;
            }

            try {
                await authService.verifyEmail(token);
                setStatus('success');
                setMessage('Your email address has been successfully verified.');
                setTimeout(() => {
                    window.location.href = '/setup-2fa';
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Verification failed. The link may be invalid or expired.'
                );
            }
        };

        verify();
    }, [location.search]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-black px-4 font-sans">
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

                    {/* ── Verifying ── */}
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6 border border-brand-green/20">
                                <Loader2 className="h-9 w-9 text-brand-green animate-spin" />
                            </div>
                            <h2 className="text-2xl font-serif font-medium text-brand-text-primary mb-3">
                                Verifying your email…
                            </h2>
                            <p className="text-brand-text-secondary text-sm leading-relaxed">
                                Please wait while we confirm your email address. This only takes a moment.
                            </p>
                        </div>
                    )}

                    {/* ── Success ── */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6 border border-brand-green/20">
                                <CheckCircle className="h-10 w-10 text-brand-green" />
                            </div>
                            <h2 className="text-2xl font-serif font-medium text-brand-text-primary mb-3">
                                Email Verified!
                            </h2>
                            <p className="text-brand-text-secondary mb-6 text-sm leading-relaxed">
                                {message}
                            </p>
                            <p className="text-xs text-brand-text-secondary/60 animate-pulse">
                                Redirecting to 2FA setup in a moment…
                            </p>
                        </div>
                    )}

                    {/* ── Error ── */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-200">
                                <AlertCircle className="h-10 w-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-serif font-medium text-brand-text-primary mb-3">
                                Verification Failed
                            </h2>
                            <p className="text-brand-text-secondary mb-8 text-sm leading-relaxed">
                                {message}
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green-hover transition-all"
                            >
                                Back to Login
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-brand-text-secondary mt-6">
                    Didn't receive an email?{' '}
                    <Link to="/login" className="text-brand-green hover:underline font-medium">
                        Return to login
                    </Link>{' '}
                    and try registering again.
                </p>
            </div>
        </div>
    );
}
