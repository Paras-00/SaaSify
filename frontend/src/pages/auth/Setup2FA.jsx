import { AlertCircle, ArrowRight, CheckCircle, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function Setup2FA() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    // Get token from location state (passed from Register page) or localStorage
    const token = location.state?.token || localStorage.getItem('accessToken');

    useEffect(() => {
        // If no token, redirect to login
        if (!token) {
            toast.error('Session expired. Please login again.');
            navigate('/login');
            return;
        }

        const fetchQRCode = async () => {
            try {
                setLoading(true);
                const response = await authService.setup2FA(token);
                // Assuming response structure matches typical backend:
                // data: { qrCode: "data:image/...", secret: "..." }
                if (response.data) {
                    setQrCode(response.data.qrCode);
                    setManualCode(response.data.secret || response.data.manualCode);
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load 2FA setup details.');
                setError('Could not load QR code. Please refresh or try logging in again.');
            } finally {
                setLoading(false);
            }
        };

        fetchQRCode();
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        try {
            setVerifying(true);
            setError('');

            await authService.verify2FASetup(token, otp);

            toast.success('2FA Setup Complete! Please login to continue.');

            // Clear session and redirect to login
            localStorage.removeItem('accessToken');
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError('Invalid code. Please try again.');
            toast.error('Verification failed');
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black">
                <Loader2 className="w-10 h-10 text-brand-green animate-spin mb-4" />
                <p className="text-brand-text-secondary font-medium">Setting up security...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-black p-4 font-sans selection:bg-brand-green selection:text-white">
            <div className="max-w-md w-full">
                <div className="bg-brand-dark rounded-2xl shadow-sm overflow-hidden border border-gray-300">
                    {/* Header */}
                    <div className="p-6 border-b border-brand-gray/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center border border-brand-green/20">
                                <ShieldCheck className="w-6 h-6 text-brand-green" />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif font-bold text-brand-text-primary">Secure Your Account</h2>
                                <p className="text-brand-text-secondary text-sm">
                                    Scan QR code to enable Two-Factor Authentication.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* QR Code Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-brand-gray/20 shadow-sm mb-4">
                                {qrCode ? (
                                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 object-contain" />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center bg-brand-gray/5 rounded-lg text-brand-text-secondary">
                                        <Loader2 className="animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="text-center w-full">
                                {manualCode && (
                                    <div className="mt-2 bg-brand-gray/5 p-3 rounded-lg border border-brand-gray/10">
                                        <p className="text-xs text-brand-text-secondary mb-1">Manual Entry Code</p>
                                        <p className="text-sm font-mono font-medium text-brand-text-primary select-all break-all">
                                            {manualCode}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Verification Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-semibold text-brand-text-primary mb-2 uppercase tracking-wider">
                                    Enter 6-digit Verification Code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-brand-text-secondary" />
                                    </div>
                                    <input
                                        id="otp"
                                        type="text"
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setOtp(val);
                                            if (val.length > 0) setError('');
                                        }}
                                        className={`block w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-1 focus:outline-none transition-colors text-lg tracking-widest font-mono bg-brand-gray/5 placeholder:text-brand-text-secondary/50 ${error
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500'
                                            : 'border-gray-300 focus:border-brand-green focus:ring-brand-green text-brand-text-primary'
                                            }`}
                                        placeholder="000 000"
                                        autoComplete="one-time-code"
                                    />
                                    {otp.length === 6 && !error && (
                                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green w-5 h-5" />
                                    )}
                                </div>
                                {error && (
                                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {error}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={verifying || otp.length !== 6}
                                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-brand-green hover:bg-brand-green-hover focus:outline-none focus:ring-1 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Verify & Enable 2FA
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-brand-text-secondary">
                    Lost your authenticator app? Contact support immediately.
                </p>
            </div>
        </div>
    );
}
