import { ArrowDownRight, ArrowUpRight, DollarSign, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import toast from 'react-hot-toast';
import { walletService } from '../../services/walletService';

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <button className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
          <Plus size={20} />
          Add Funds
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign size={32} />
          <h2 className="text-xl font-semibold">Available Balance</h2>
        </div>
        <p className="text-5xl font-bold mb-2">
          ${balance?.balance?.toFixed(2) || '0.00'}
        </p>
        <p className="text-purple-100">Currency: {balance?.currency || 'USD'}</p>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <TransactionItem key={tx._id} transaction={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
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
        {isCredit ? '+' : '-'}${transaction.amount.toFixed(2)}
      </p>
    </div>
  );
}
