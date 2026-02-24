import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CreditCard,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  ShieldCheck,
  Wallet as WalletIcon,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { walletService } from '../../services/walletService';

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        walletService.getWalletBalance(),
        walletService.getWalletTransactions({ page: 1, limit: 10 }),
      ]);
      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFundsSuccess = () => {
    setShowAddFunds(false);
    fetchWalletData();
    toast.success('Funds added successfully!');
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-green" size={32} />
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-text-primary font-medium">Wallet & Billing</h1>
          <p className="text-brand-text-secondary mt-1">Manage your funds and view transaction history.</p>
        </div>
        <button
          onClick={() => setShowAddFunds(true)}
          className="px-6 py-2.5 bg-brand-green text-white font-semibold rounded-full hover:bg-brand-green-hover transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Add Funds
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Balance & Quick Actions */}
        <div className="space-y-8">
          {/* Balance Card */}
          <div className="bg-brand-dark rounded-3xl p-8 border border-gray-300 relative overflow-hidden group">
            {/* Background Decorations */}
            {/* Background decoration removed */}

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green">
                  <WalletIcon size={24} />
                </div>
                <h2 className="text-xl font-medium text-brand-text-primary font-serif">Current Balance</h2>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-serif text-brand-text-primary block mb-1 tracking-tight">
                  {formatCurrency(balance?.balance || 0, 'INR')}
                </span>
                <p className="text-brand-text-secondary text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                  Available for immediate use
                </p>
              </div>

              <div className="pt-6 border-t border-brand-gray/20 flex items-center justify-between text-sm">
                <div className="text-brand-text-secondary">Last updated</div>
                <div className="text-brand-text-primary font-medium">Just now</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-brand-dark border border-gray-300 rounded-2xl p-6">
            <h3 className="text-lg font-serif text-brand-text-primary mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowAddFunds(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-brand-gray/5 border border-gray-300 hover:border-[#004643] transition-all text-left text-brand-text-primary group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <span className="font-medium">Add Money</span>
                </div>
                <ChevronRight size={18} className="text-gray-500 group-hover:text-brand-green transition-colors" />
              </button>

              <button
                className="w-full flex items-center justify-between p-4 rounded-xl bg-brand-gray/5 border border-gray-300 hover:border-[#004643] transition-all text-left text-brand-text-primary group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Download size={20} />
                  </div>
                  <span className="font-medium">Download Statement</span>
                </div>
                <ChevronRight size={18} className="text-gray-500 group-hover:text-brand-green transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-brand-dark border border-gray-300 rounded-2xl p-6 h-full">
            <h2 className="text-xl font-serif text-brand-text-primary mb-6">Transaction History</h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-brand-green" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-brand-gray/10 flex items-center justify-center mx-auto mb-4 border border-gray-300">
                  <Clock className="h-8 w-8 text-brand-text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-brand-text-primary mb-1">No transactions yet</h3>
                <p className="text-brand-text-secondary">Your transaction history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const isCredit = transaction.type === 'credit' || (transaction.type === 'payment' && transaction.description?.toLowerCase().includes('top-up'));
                  const StatusIcon = isCredit ? ArrowDownLeft : ArrowUpRight;

                  return (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-300 hover:border-[#004643] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCredit ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-gray/10 text-brand-text-secondary'
                          }`}>
                          <StatusIcon size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-brand-text-primary mb-0.5">{transaction.description}</p>
                          <p className="text-xs text-brand-text-secondary">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-serif font-medium text-lg ${isCredit ? 'text-brand-green' : 'text-brand-text-primary'
                          }`}>
                          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${transaction.status === 'completed' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                          transaction.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <AddFundsModal
          onClose={() => setShowAddFunds(false)}
          onSuccess={handleAddFundsSuccess}
        />
      )}
    </div>
  );
}

function TransactionItem({ transaction }) {
  const isCredit = transaction.type === 'credit';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
          {isCredit ? (
            <ArrowDownRight className="text-green-600" size={20} />
          ) : (
            <ArrowUpRight className="text-red-600" size={20} />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{transaction.description}</p>
          <p className="text-sm text-gray-500">
            {new Date(transaction.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
        {isCredit ? '+' : '-'}₹{transaction.amount.toFixed(2)}
      </p>
    </div>
  );
}

function AddFundsModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddFunds = async () => {
    const parsedAmount = parseFloat(amount);

    if (!amount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parsedAmount < 100) {
      toast.error('Minimum amount is ₹100');
      return;
    }

    try {
      setProcessing(true);

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK');
        setProcessing(false);
        return;
      }

      // Create Razorpay order for wallet
      const orderResponse = await paymentService.createWalletRazorpayOrder({
        amount: parsedAmount,
      });

      const orderData = orderResponse.data || orderResponse;
      const { orderId, amount: orderAmount, currency } = orderData;

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Rq11q8EgPkkSJL',
        amount: Math.round(orderAmount * 100), // Amount in paise
        currency: currency,
        name: 'SaaSify',
        description: 'Add Funds to Wallet',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend via wallet topup endpoint
            await walletService.addFunds({
              amount: parsedAmount,
              gateway: 'razorpay',
              paymentData: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            onSuccess();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.error('Payment cancelled');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#00D285'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error(error.response?.data?.error || 'Failed to initialize payment');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text-primary/50">
      <div className="bg-white rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-6 border-b border-brand-gray/20 flex items-center justify-between">
          <h3 className="text-xl font-serif text-brand-text-primary">Add Funds</h3>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            disabled={processing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
              Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-text-secondary font-serif text-lg">₹</span>
              <input
                type="number"
                min="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-serif text-lg"
                placeholder="Enter amount"
                disabled={processing}
              />
            </div>
            <p className="text-xs text-brand-text-secondary mt-2">
              Minimum deposit amount is ₹100
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Quick Select</p>
            <div className="grid grid-cols-3 gap-3">
              {[500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className="py-2 px-3 rounded-lg bg-brand-gray/5 border border-gray-300 text-brand-text-primary text-sm hover:border-[#004643] transition-all"
                  disabled={processing}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-brand-green/5 border border-brand-green/10 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="text-brand-green flex-shrink-0" size={18} />
            <p className="text-xs text-brand-text-secondary leading-relaxed">
              Values are secured with 256-bit encryption. Your payment details are never stored on our servers.
            </p>
          </div>

          <button
            onClick={handleAddFunds}
            disabled={processing || !amount || Number(amount) < 100}
            className="w-full py-3.5 bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <CreditCard size={20} />
                Pay ₹{amount || '0'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}