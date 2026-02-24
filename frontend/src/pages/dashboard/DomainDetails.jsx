import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { domainService } from '../../services/domainService';

const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  suspended: 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusIcons = {
  active: CheckCircleIcon,
  pending: ClockIcon,
  expired: XCircleIcon,
  cancelled: XCircleIcon,
  suspended: ExclamationTriangleIcon,
};

export default function DomainDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [domain, setDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copying, setCopying] = useState(null);

  useEffect(() => {
    fetchDomainDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDomainDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await domainService.getDomainById(id);
      setDomain(response.data.domain);
    } catch (err) {
      console.error('Error fetching domain:', err);
      setError(err.response?.data?.error || 'Failed to load domain details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(field);
      setTimeout(() => setCopying(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={() => navigate('/dashboard/domains')}
            className="mt-4 text-red-600 hover:text-red-800 font-medium"
          >
            ← Back to Domains
          </button>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Domain not found</p>
          <button
            onClick={() => navigate('/dashboard/domains')}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Domains
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[domain.status] || ClockIcon;
  const daysUntilExpiry = getDaysUntilExpiry(domain.expiryDate);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/domains')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Domains
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <GlobeAltIcon className="h-10 w-10 text-blue-600 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{domain.domainName}</h1>
              <p className="text-gray-500 mt-1">{domain.registrar || 'Managed Domain'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[domain.status] || statusColors.pending}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Expiry Warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Domain Expiring Soon</p>
            <p className="text-sm text-yellow-700 mt-1">
              This domain will expire in {daysUntilExpiry} days. Renew now to avoid service interruption.
            </p>
          </div>
        </div>
      )}

      {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <XCircleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Domain Expired</p>
            <p className="text-sm text-red-700 mt-1">
              This domain has expired. Renew immediately to prevent loss of ownership.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registration Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <CalendarIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Registration Information</h2>
              {domain.liveStatus && (
                <span className="ml-3 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-100">
                  Live Status
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registration Date</p>
                <p className="font-medium text-gray-900">
                  {formatDate(domain.registrationDate || domain.liveStatus?.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                <p className="font-medium text-gray-900">
                  {formatDate(domain.expiryDate || domain.liveStatus?.expires)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Registration Period</p>
                <p className="font-medium text-gray-900">{domain.yearsPurchased} year(s)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Auto-Renew</p>
                <p className="font-medium text-gray-900">
                  {domain.autoRenew ? (
                    <span className="text-green-600">✓ Enabled</span>
                  ) : (
                    <span className="text-gray-600">✗ Disabled</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Nameservers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Nameservers</h2>
            </div>
            {domain.nameservers && domain.nameservers.length > 0 ? (
              <div className="space-y-3">
                {domain.nameservers.map((ns, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm text-gray-900">{ns}</span>
                    <button
                      onClick={() => handleCopy(ns, `ns-${index}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                      {copying === `ns-${index}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No nameservers configured</p>
            )}
          </div>

          {/* Contact Information */}
          {domain.contacts && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {domain.contacts.registrant && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Registrant</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{domain.contacts.registrant.name}</p>
                      <p>{domain.contacts.registrant.email}</p>
                      {domain.contacts.registrant.phone && <p>{domain.contacts.registrant.phone}</p>}
                    </div>
                  </div>
                )}
                {domain.contacts.admin && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Admin</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{domain.contacts.admin.name}</p>
                      <p>{domain.contacts.admin.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700">Privacy Protection</span>
                </div>
                <span className={`text-sm font-medium ${domain.whoisPrivacy?.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {domain.whoisPrivacy?.enabled ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-700">Transfer Lock</span>
                </div>
                <span className={`text-sm font-medium ${domain.transferLock ? 'text-green-600' : 'text-gray-600'}`}>
                  {domain.transferLock ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Registration</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(domain.registrationPrice, domain.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Renewal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(domain.renewalPrice, domain.currency)}
                </span>
              </div>
              {domain.transferPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transfer</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(domain.transferPrice, domain.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Manage DNS
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Renew Domain
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Transfer Domain
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
