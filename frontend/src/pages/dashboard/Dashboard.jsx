import { FileText, Globe, TrendingUp, Wallet as WalletIcon } from 'lucide-react';

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your account.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Globe className="text-purple-600" size={24} />}
          title="Domains"
          value="0"
          subtitle="Active domains"
          color="purple"
        />
        <StatCard
          icon={<FileText className="text-blue-600" size={24} />}
          title="Invoices"
          value="0"
          subtitle="Pending invoices"
          color="blue"
        />
        <StatCard
          icon={<WalletIcon className="text-green-600" size={24} />}
          title="Wallet"
          value="$0.00"
          subtitle="Available balance"
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="text-orange-600" size={24} />}
          title="Spent"
          value="$0.00"
          subtitle="Total this month"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-6 py-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-left">
            <h3 className="font-semibold mb-1">Register Domain</h3>
            <p className="text-sm text-purple-600/70">Find and register new domains</p>
          </button>
          <button className="px-6 py-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <h3 className="font-semibold mb-1">View Invoices</h3>
            <p className="text-sm text-blue-600/70">Check pending payments</p>
          </button>
          <button className="px-6 py-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-left">
            <h3 className="font-semibold mb-1">Add Funds</h3>
            <p className="text-sm text-green-600/70">Top up your wallet</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No recent activity</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color }) {
  const colorClasses = {
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
