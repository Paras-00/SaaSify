import { CreditCard, Loader2, Lock, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

import cartService from '../services/cartService';
import useAuthStore from '../store/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { loadRazorpayScript } from '../utils/scriptLoader';
import toast from 'react-hot-toast';

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [billingInfo, setBillingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  const [termsAgreed, setTermsAgreed] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    } else {
      loadCart();
    }
    loadRazorpayScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoiceById(invoiceId);
      if (response.data?.invoice) {
        setInvoice(response.data.invoice);
      } else {
        throw new Error('Invoice not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoice');
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (!response.data?.cart || response.data.cart.items.length === 0) {
        navigate('/dashboard/cart');
        return;
      }
      setCart(response.data.cart);
    } catch (err) {
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCountryCode = (country) => {
    const countryMap = {
      'India': 'IN',
      'USA': 'US',
      'United States': 'US',
      'UK': 'GB',
      'United Kingdom': 'GB',
      'Canada': 'CA',
      'Australia': 'AU',
    };
    return countryMap[country] || country;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!termsAgreed) {
      setError('Please agree to the terms and conditions');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      if (invoiceId && invoice) {
        // Direct invoice payment
        const orderData = {
          amount: Math.round(invoice.total * 100), // convert to paise
          currency: invoice.currency || 'INR',
          invoiceId: invoice._id,
        };

        const response = await paymentService.createRazorpayOrder(orderData);
        if (response.data?.order) {
          await handleRazorpayPayment(response.data.order, true);
        } else {
          throw new Error('Failed to create payment order');
        }
      } else {
        // Cart checkout
        const checkoutData = {
          billingDetails: {
            firstName: billingInfo.firstName,
            lastName: billingInfo.lastName,
            email: billingInfo.email,
            phone: billingInfo.phone,
            address: {
              street: billingInfo.address,
              city: billingInfo.city,
              state: billingInfo.state,
              zipCode: billingInfo.zipCode,
              country: getCountryCode(billingInfo.country),
            },
          },
          paymentMethod: 'razorpay',
          termsAgreed: termsAgreed,
        };

        const response = await cartService.checkout(checkoutData);

        if (response.data?.order && response.data.order.razorpayOrderId) {
          await handleRazorpayPayment(response.data.order, false);
        } else {
          throw new Error('Invalid order response');
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Checkout failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async (order, isInvoicePayment = false) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: isInvoicePayment ? order.amount : order.razorpayAmount,
      currency: (isInvoicePayment ? order.currency : order.razorpayCurrency) || 'INR',
      name: 'SaaSify',
      description: isInvoicePayment ? `Payment for Invoice ${invoice.invoiceNumber}` : 'Domain Registration',
      order_id: isInvoicePayment ? order.id : order.razorpayOrderId,
      handler: async function (response) {
        try {
          let result;
          if (isInvoicePayment) {
            const verifyData = {
              invoiceId: invoice._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };
            result = await paymentService.verifyRazorpayPayment(verifyData);
          } else {
            const verifyData = {
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };
            result = await cartService.verifyPayment(verifyData);
          }

          if (result.success || result.data?.success) {
            toast.success('Payment successful!');
            navigate('/dashboard/invoices', {
              state: { message: 'Payment successful!' }
            });
          } else {
            setError('Payment verification failed');
            setProcessing(false);
          }
        } catch (err) {
          setError(err.message || 'Payment verification failed');
          setProcessing(false);
        }
      },
      prefill: {
        name: `${billingInfo.firstName} ${billingInfo.lastName}`,
        email: billingInfo.email,
        contact: billingInfo.phone,
      },
      theme: {
        color: '#00D285', // updated to brand green
      },
      modal: {
        ondismiss: function () {
          setError('Payment cancelled. Please try again.');
          setProcessing(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-black">
        <Loader2 className="animate-spin h-10 w-10 text-brand-green" />
      </div>
    );
  }

  if (!invoiceId && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-brand-black py-20 font-sans">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-brand-gray/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-300">
            <ShoppingCart className="h-8 w-8 text-brand-text-secondary" />
          </div>
          <p className="text-xl text-brand-text-primary">Your cart is empty</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-brand-green hover:underline"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (invoiceId && !invoice) {
    return (
      <div className="min-h-screen bg-brand-black py-20 font-sans">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xl text-brand-text-primary">Invoice not found</p>
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="mt-4 text-brand-green hover:underline"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const subtotal = invoiceId ? invoice.subtotal : (cart.total || 0);
  const tax = invoiceId ? (invoice.totalTax || 0) : (subtotal * 0.18);
  const total = invoiceId ? invoice.total : (subtotal + tax);
  const currency = invoiceId ? (invoice.currency || 'INR') : 'USD';

  return (
    <div className="min-h-screen bg-brand-black py-12 font-sans">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-serif text-brand-text-primary mb-10">Checkout</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Billing Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCheckout} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-300">
              <h2 className="text-xl font-serif text-brand-text-primary mb-8">Billing Information</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={billingInfo.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={billingInfo.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={billingInfo.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                  placeholder="john@example.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={billingInfo.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                  placeholder="+1 234 567 890"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={billingInfo.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Street address"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={billingInfo.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    State / Province *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={billingInfo.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    ZIP / Postal Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={billingInfo.zipCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                    Country *
                  </label>
                  <select
                    name="country"
                    value={billingInfo.country}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-brand-text-primary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
                  >
                    <option value="India">India</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <div className="mb-8">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-brand-gray/5 transition-all checked:border-brand-green checked:bg-brand-green"
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">
                    I agree to the{' '}
                    <a href="#" className="text-brand-green hover:underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-brand-green hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={processing || !termsAgreed}
                className="w-full bg-brand-green text-white py-4 rounded-xl hover:bg-brand-green-hover transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Pay {currency === 'INR' ? '₹' : '$'}{total.toFixed(2)}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-300 sticky top-24">
              <h2 className="text-xl font-serif text-brand-text-primary mb-6">
                {invoiceId ? 'Invoice Summary' : 'Order Summary'}
              </h2>

              <div className="space-y-4 mb-8">
                {invoiceId ? (
                  invoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-brand-text-secondary truncate mr-2">
                        {item.description}
                      </span>
                      <span className="font-medium text-brand-text-primary">
                        {currency === 'INR' ? '₹' : '$'}{item.total.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-brand-text-secondary truncate mr-2">
                        {item.name} <span className="text-xs text-brand-text-secondary/50">({item.period}y)</span>
                      </span>
                      <span className="font-medium text-brand-text-primary">
                        ${(item.price * item.period).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-brand-gray/20 pt-6 space-y-3">
                <div className="flex justify-between text-brand-text-secondary">
                  <span>Subtotal</span>
                  <span className="text-brand-text-primary">{currency === 'INR' ? '₹' : '$'}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-text-secondary">
                  <span>Tax {invoiceId && '(GST)'}</span>
                  <span className="text-brand-text-primary">{currency === 'INR' ? '₹' : '$'}{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-brand-gray/20 pt-4">
                  <div className="flex justify-between text-xl font-medium">
                    <span className="text-brand-text-primary">Total</span>
                    <span className="text-brand-green">{currency === 'INR' ? '₹' : '$'}{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-brand-gray/20">
                <div className="flex items-center gap-3 text-sm text-brand-text-secondary mb-3">
                  <Lock size={16} className="text-brand-green" />
                  <span>Secure payment via Razorpay</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-brand-text-secondary">
                  <CreditCard size={16} className="text-brand-green" />
                  <span>Accepts all major payment methods</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
