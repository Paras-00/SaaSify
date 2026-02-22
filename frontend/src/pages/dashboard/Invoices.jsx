import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  Loader2,
  Search,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { invoiceService } from '../../services/invoiceService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  unpaid: {
    label: 'Unpaid',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
  partially_paid: {
    label: 'Partially Paid',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
    iconColor: 'text-gray-600'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: CheckCircle,
    iconColor: 'text-purple-600'
  },
};

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 10,
          ...(statusFilter !== 'all' && { status: statusFilter }),
        };

        const response = await invoiceService.getMyInvoices(params);

        if (!isMounted) return;

        setInvoices(response.data.invoices || []);
        setTotalPages(response.data.pagination?.totalPages || 1);

        // Calculate stats
        if (response.data.invoices) {
          const allInvoices = response.data.invoices;
          setStats({
            total: allInvoices.length,
            paid: allInvoices.filter(i => i.status === 'paid').length,
            unpaid: allInvoices.filter(i => i.status === 'unpaid').length,
            overdue: allInvoices.filter(i => i.status === 'overdue').length,
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching invoices:', error);
        toast.error(error.message || 'Failed to load invoices');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();

    return () => {
      isMounted = false;
    };
  }, [page, statusFilter]);

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleDownloadPDF = async (invoiceId, e) => {
    e.stopPropagation();
    try {
      await invoiceService.downloadInvoicePDF(invoiceId);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-text-primary font-medium">Invoices</h1>
          <p className="text-brand-text-secondary mt-1">View and manage your billing history and payments.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={<FileText size={20} />}
          label="Total Invoices"
          value={stats.total}
          color="blue"
        />
        <StatsCard
          icon={<CheckCircle size={20} />}
          label="Paid"
          value={stats.paid}
          color="green"
        />
        <StatsCard
          icon={<Clock size={20} />}
          label="Unpaid"
          value={stats.unpaid}
          color="yellow"
        />
        <StatsCard
          icon={<AlertCircle size={20} />}
          label="Overdue"
          value={stats.overdue}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-text-secondary group-focus-within:text-brand-green transition-colors" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-light"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-brand-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-brand-green" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-brand-gray/5 flex items-center justify-center mx-auto mb-6 border border-brand-gray/10">
            <FileText className="h-8 w-8 text-brand-text-secondary" />
          </div>
          <h2 className="text-2xl font-serif text-brand-text-primary mb-2">
            {searchQuery ? 'No invoices found' : 'No invoices yet'}
          </h2>
          <p className="text-brand-text-secondary mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms or filters to find what you are looking for.'
              : 'Your invoices will appear here once you make a purchase.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice._id}
                invoice={invoice}
                onClick={() => navigate(`/dashboard/invoices/${invoice._id}`)}
                onDownload={(e) => handleDownloadPDF(invoice._id, e)}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-brand-text-primary hover:bg-brand-gray/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-brand-text-secondary text-sm">
                Page <span className="text-brand-text-primary font-medium">{page}</span> of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-brand-text-primary hover:bg-brand-gray/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatsCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-brand-green bg-brand-green/10 border-brand-green/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 border ${colorClasses[color]} bg-opacity-20`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-brand-text-secondary mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-serif text-brand-text-primary">{value}</p>
    </div>
  );
}

function InvoiceCard({ invoice, onClick, onDownload, formatDate, formatCurrency }) {
  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.unpaid;
  const StatusIcon = statusConfig.icon;
  const isDue = invoice.status === 'unpaid' || invoice.status === 'overdue';

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-300 rounded-xl p-6 hover:border-[#004643] transition-all duration-300 cursor-pointer group shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Invoice Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border border-gray-300 ${invoice.status === 'paid' ? 'bg-brand-green/10 text-brand-green' :
            invoice.status === 'overdue' ? 'bg-red-500/10 text-red-500' :
              'bg-brand-gray/10 text-brand-text-secondary'
            }`}>
            <StatusIcon size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-xl font-medium text-brand-text-primary group-hover:text-brand-green transition-colors font-serif">
                {invoice.invoiceNumber}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${invoice.status === 'paid' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                invoice.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-brand-gray/10 text-brand-text-secondary border-brand-gray/20'
                }`}>
                {statusConfig.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-brand-text-secondary mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>Issued: {formatDate(invoice.invoiceDate)}</span>
              </div>

              {invoice.dueDate && (
                <div className={`flex items-center gap-1.5 ${isDue ? 'text-red-400 font-medium' : ''}`}>
                  <Clock size={14} />
                  <span>Due: {formatDate(invoice.dueDate)}</span>
                </div>
              )}
            </div>

            {invoice.description && (
              <p className="text-sm text-brand-text-secondary truncate max-w-md">
                {invoice.description}
              </p>
            )}
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex flex-col items-end gap-4">
          <div className="text-right">
            <div className="text-2xl font-serif text-brand-text-primary">
              {formatCurrency(invoice.totalAmount, invoice.currency)}
            </div>
            {invoice.status === 'partially_paid' && invoice.paidAmount > 0 && (
              <p className="text-sm text-brand-green">
                Paid: {formatCurrency(invoice.paidAmount, invoice.currency)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDue && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(e);
                }}
                className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green-hover transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <CreditCard size={14} />
                Pay Now
              </button>
            )}
            <button
              onClick={onDownload}
              className="p-2 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-gray/10 rounded-lg transition-colors border border-transparent hover:border-brand-gray/10"
              title="Download PDF"
            >
              <Download size={18} />
            </button>
            <div className="w-8 h-8 rounded-full border border-brand-gray/10 flex items-center justify-center text-brand-text-secondary group-hover:border-brand-green group-hover:text-brand-green transition-all">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
