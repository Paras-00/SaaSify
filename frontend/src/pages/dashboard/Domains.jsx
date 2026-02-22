import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Filter,
  Globe,
  Loader2,
  Search,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { domainService } from '../../services/domainService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    iconColor: 'text-yellow-600'
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600'
  },
  suspended: {
    label: 'Suspended',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle,
    iconColor: 'text-orange-600'
  },
};

export default function Domains() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const fetchDomains = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 10,
          ...(statusFilter !== 'all' && { status: statusFilter }),
        };

        const response = await domainService.getMyDomains(params);

        if (!isMounted) return;

        setDomains(response.data.domains || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching domains:', error);
        toast.error(error.message || 'Failed to load domains');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDomains();

    return () => {
      isMounted = false;
    };
  }, [page, statusFilter]);

  const filteredDomains = domains.filter(domain =>
    domain.domainName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-text-primary font-medium">My Domains</h1>
          <p className="text-brand-text-secondary mt-1">Manage all your registered domains and configurations.</p>
        </div>
        <button
          onClick={() => navigate('/search')}
          className="px-6 py-2.5 bg-brand-green text-white font-semibold rounded-full hover:bg-brand-green-hover transition-all flex items-center gap-2 shadow-sm"
        >
          <Globe size={18} />
          Register New Domain
        </button>
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
              placeholder="Search domains..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all"
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Domains List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-brand-green" />
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-brand-gray/5 flex items-center justify-center mx-auto mb-6 border border-brand-gray/10">
            <Globe className="h-8 w-8 text-brand-text-secondary" />
          </div>
          <h2 className="text-2xl font-serif text-brand-text-primary mb-2">
            {searchQuery ? 'No domains found' : 'No domains yet'}
          </h2>
          <p className="text-brand-text-secondary mb-8 max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms or filters to find what you are looking for.'
              : 'Start building your digital presence by identifying your perfect domain name today.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/search')}
              className="px-8 py-3 bg-brand-green text-white font-bold rounded-full hover:bg-brand-green-hover transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <Globe size={20} />
              Search Domains
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredDomains.map((domain) => (
              <DomainCard
                key={domain._id}
                domain={domain}
                onClick={() => navigate(`/dashboard/domains/${domain._id}`)}
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

function DomainCard({ domain, onClick }) {
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusConfig = STATUS_CONFIG[domain.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const daysUntilExpiry = getDaysUntilExpiry(domain.expiryDate);
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-300 rounded-xl p-6 hover:border-[#004643] transition-all duration-300 cursor-pointer group shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Domain Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border border-gray-300 ${domain.status === 'active' ? 'bg-brand-green/10 text-brand-green' :
            domain.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
              'bg-brand-gray/10 text-brand-text-secondary'
            }`}>
            <StatusIcon size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-medium text-brand-text-primary truncate group-hover:text-brand-green transition-colors font-serif">
                {domain.domainName}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${domain.status === 'active' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                domain.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                  'bg-brand-gray/10 text-brand-text-secondary border-brand-gray/20'
                }`}>
                {statusConfig.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-brand-text-secondary">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>Registered: {formatDate(domain.registrationDate)}</span>
              </div>

              {domain.expiryDate && (
                <div className={`flex items-center gap-1.5 ${isExpiringSoon ? 'text-orange-400 font-medium' : ''}`}>
                  <Clock size={14} />
                  <span>
                    Expires: {formatDate(domain.expiryDate)}
                    {isExpiringSoon && ` (${daysUntilExpiry} days)`}
                  </span>
                </div>
              )}
            </div>

            {isExpiringSoon && (
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20 inline-flex">
                <AlertCircle size={14} />
                <span className="font-medium">Expiring soon! Renew to avoid service interruption.</span>
              </div>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0 self-center">
          <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-brand-text-secondary group-hover:border-[#004643] group-hover:text-brand-green transition-all">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
