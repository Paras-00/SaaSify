import { AlertCircle, ArrowRight, FileText, Globe, Loader2, TrendingUp, Wallet as WalletIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { domainService } from '../../services/domainService';
import { invoiceService } from '../../services/invoiceService';
import { walletService } from '../../services/walletService';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeDomains: 0,
    pendingInvoices: 0,
    totalBalance: 0,
    monthlySpend: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const [domainRes, invoiceRes, walletRes] = await Promise.all([
          domainService.getMyDomains(),
          invoiceService.getMyInvoices(),
          walletService.getWalletBalance()
        ]);

        if (!isMounted) return;

        // Unwrap the { success, data, message } wrapper each service returns
        const domains = Array.isArray(domainRes?.data) ? domainRes.data : [];
        const invoices = Array.isArray(invoiceRes?.data) ? invoiceRes.data : [];
        const wallet = walletRes?.data || {};

        // Calculate stats
        const activeDomains = domains.filter(d => d.auto_renew).length;
        const pendingInvoices = invoices.filter(i => i.status === 'pending').length;

        // Mock data for monthly spend if not available
        const monthlySpend = 124.50;

        // Mock recent activity
        const activities = [
          { id: 1, type: 'domain_renewed', description: 'saasify.io renewed for 1 year', time: '2 hours ago', icon: Globe },
          { id: 2, type: 'invoice_paid', description: 'Invoice #INV-2024-001 paid', time: '1 day ago', icon: FileText },
          { id: 3, type: 'funds_added', description: '$50.00 added to wallet', time: '2 days ago', icon: WalletIcon },
        ];

        setStats({
          activeDomains,
          pendingInvoices,
          totalBalance: wallet.balance ?? 0,
          monthlySpend
        });
        setRecentActivity(activities);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        if (isMounted) setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-brand-green" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 mt-2">
        <h1 className="text-3xl font-bold text-brand-text-primary font-serif">Dashboard</h1>
        <p className="text-brand-text-secondary mt-2">Welcome back! Here's an overview of your account.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Globe size={22} />}
          title="Domains"
          value={stats.activeDomains.toString()}
          subtitle="Active domains"
          color="green"
          link="/dashboard/domains"
        />
        <StatCard
          icon={<FileText size={22} />}
          title="Invoices"
          value={stats.pendingInvoices.toString()}
          subtitle="Pending invoices"
          color="zinc"
          link="/dashboard/invoices"
        />
        <StatCard
          icon={<WalletIcon size={22} />}
          title="Wallet"
          value={formatCurrency(stats.totalBalance)}
          subtitle="Available balance"
          color="blue"
          link="/dashboard/wallet"
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          title="Spent"
          value={formatCurrency(stats.monthlySpend)}
          subtitle="Total this month"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-brand-text-primary font-serif">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/search"
            className="group px-6 py-4 bg-brand-gray/5 border border-gray-300 rounded-xl hover:border-[#004643] transition-all text-left block"
          >
            <h3 className="font-semibold mb-1 text-brand-text-primary group-hover:text-brand-green transition-colors">Register Domain</h3>
            <p className="text-sm text-brand-text-secondary">Find and register new domains</p>
          </Link>
          <Link
            to="/dashboard/invoices"
            className="group px-6 py-4 bg-brand-gray/5 border border-gray-300 rounded-xl hover:border-[#004643] transition-all text-left block"
          >
            <h3 className="font-semibold mb-1 text-brand-text-primary group-hover:text-brand-green transition-colors">View Invoices</h3>
            <p className="text-sm text-brand-text-secondary">Check pending payments</p>
          </Link>
          <Link
            to="/dashboard/wallet"
            className="group px-6 py-4 bg-brand-gray/5 border border-gray-300 rounded-xl hover:border-[#004643] transition-all text-left block"
          >
            <h3 className="font-semibold mb-1 text-brand-text-primary group-hover:text-brand-green transition-colors">Add Funds</h3>
            <p className="text-sm text-brand-text-secondary">Top up your wallet</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        {/* Glow effect removed */}

        <div className="flex items-center justify-between mb-4 relative z-10">
          <h2 className="text-xl font-semibold text-brand-text-primary font-serif">Recent Activity</h2>
          {recentActivity.length > 0 && (
            <Link
              to="/dashboard/domains"
              className="text-brand-green hover:text-brand-green-hover text-sm font-medium flex items-center gap-1 transition-colors"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-8 relative z-10">
            <div className="w-12 h-12 rounded-full bg-brand-gray/10 flex items-center justify-center mx-auto mb-3 border border-brand-gray/10">
              <AlertCircle className="text-brand-text-secondary" size={24} />
            </div>
            <p className="text-brand-text-primary font-medium">No recent activity</p>
            <p className="text-brand-text-secondary text-sm mt-1">Get started by registering a domain</p>
          </div>
        ) : (
          <div className="space-y-3 relative z-10">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-4 bg-brand-gray/5 border border-gray-300 rounded-xl hover:border-[#004643] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'domain_renewed' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-gray/20 text-brand-text-secondary'
                    }`}>
                    <activity.icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-brand-text-primary group-hover:text-brand-green transition-colors">{activity.description}</p>
                    <p className="text-sm text-brand-text-secondary">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color, link, isAction }) {
  const CardContent = (
    <div className="relative h-full flex flex-col justify-between z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color === 'green' ? 'bg-brand-green/10 text-brand-green' :
          color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
            color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
              'bg-brand-gray/5 text-brand-text-secondary'
          }`}>
          {icon}
        </div>
        {isAction && <span className="text-xs font-bold text-brand-green flex items-center gap-1 cursor-pointer hover:underline">{subtitle}</span>}
        {!isAction && (
          <span className={`text-xs px-2 py-1 rounded border ${color === 'green' ? 'border-brand-green/20 text-brand-green bg-brand-green/5' : 'border-brand-gray/10 text-brand-text-secondary'
            }`}>{subtitle}</span>
        )}
      </div>

      <div>
        <h3 className="text-brand-text-secondary text-xs uppercase tracking-wider font-medium mb-2">{title}</h3>
        <p className="text-3xl font-serif text-brand-text-primary">{value}</p>
      </div>
    </div>
  );

  const containerClasses = "bg-white border border-gray-300 hover:border-[#004643] p-6 rounded-2xl h-[160px] transition-all duration-300 group relative overflow-hidden shadow-sm";
  // Glow div removed

  if (link) {
    return (
      <Link to={link} className={containerClasses}>
        {CardContent}
      </Link>
    );
  }

  return (
    <div className={containerClasses}>
      {CardContent}
    </div>
  );
}
