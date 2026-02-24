import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Loader2 } from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';

const statusColors = {
  paid: 'bg-brand-green/10 text-brand-green border-brand-green/20',
  unpaid: 'bg-red-500/10 text-red-500 border-red-500/20',
  partially_paid: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
  refunded: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const statusIcons = {
  paid: CheckCircleIcon,
  unpaid: ExclamationCircleIcon,
  partially_paid: ClockIcon,
  cancelled: ExclamationCircleIcon,
  overdue: ExclamationCircleIcon,
  refunded: CheckCircleIcon,
};

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceService.getInvoiceById(id);
      setInvoice(response.data.invoice);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err.response?.data?.error || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const blob = await invoiceService.downloadInvoicePDF(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download invoice PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handlePayNow = () => {
    navigate(`/checkout?invoiceId=${id}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-brand-green mx-auto" />
          <p className="mt-4 text-brand-text-secondary">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="px-6 py-2 bg-brand-gray/5 hover:bg-brand-gray/10 text-brand-text-primary rounded-lg transition-colors border border-gray-300"
          >
            ← Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        <div className="text-center py-20">
          <p className="text-brand-text-secondary text-lg mb-6">Invoice not found</p>
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="px-6 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-hover transition-colors"
          >
            ← Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[invoice.status] || ExclamationCircleIcon;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard/invoices')}
          className="flex items-center text-brand-text-secondary hover:text-brand-text-primary mb-6 transition-colors group"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Invoices
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium text-white">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-brand-text-secondary mt-1">Created on {formatDate(invoice.invoiceDate)}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[invoice.status] || statusColors.unpaid}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {invoice.status.split('_').join(' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
        {/* Invoice Header */}
        <div className="bg-brand-gray/5 px-8 py-8 border-b border-brand-gray/20">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center text-white font-bold text-lg">S</div>
                <h2 className="text-2xl font-serif font-bold text-brand-text-primary tracking-tight">SaaSify</h2>
              </div>
              <p className="text-brand-text-secondary text-sm">Domain & Hosting Services</p>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">Invoice Date</p>
                <p className="font-serif text-lg text-brand-text-primary">{formatDate(invoice.invoiceDate)}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">Due Date</p>
                  <p className="font-serif text-lg text-brand-text-primary">{formatDate(invoice.dueDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="px-8 py-8">
          <h3 className="text-lg font-serif text-brand-text-primary mb-6">Items</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-300">
            <table className="w-full">
              <thead className="bg-brand-gray/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-brand-text-secondary uppercase tracking-wider border-b border-brand-gray/20">
                    Description
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-brand-text-secondary uppercase tracking-wider border-b border-brand-gray/20">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-brand-text-secondary uppercase tracking-wider border-b border-brand-gray/20">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-brand-text-secondary uppercase tracking-wider border-b border-brand-gray/20">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray/20">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-brand-gray/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-brand-text-primary">{item.description}</div>
                        {item.details && <div className="text-xs text-brand-text-secondary mt-1">{item.details}</div>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-brand-text-secondary">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-sm text-brand-text-secondary">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-brand-text-primary">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-brand-text-secondary">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Totals */}
        <div className="px-8 py-8 bg-brand-gray/5 border-t border-brand-gray/20">
          <div className="max-w-xs ml-auto space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-secondary">Subtotal:</span>
              <span className="font-medium text-brand-text-primary">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>

            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Discount:</span>
                <span className="font-medium text-brand-green">
                  -{formatCurrency(invoice.totalDiscount, invoice.currency)}
                </span>
              </div>
            )}

            {invoice.totalTax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Tax:</span>
                <span className="font-medium text-brand-text-primary">
                  {formatCurrency(invoice.totalTax, invoice.currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-xl font-serif font-medium pt-4 border-t border-brand-gray/20">
              <span className="text-brand-text-primary">Total:</span>
              <span className="text-brand-green">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>

            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-sm pt-2">
                <span className="text-brand-text-secondary">Paid Amount:</span>
                <span className="font-medium text-brand-green/80">
                  {formatCurrency(invoice.paidAmount, invoice.currency)}
                </span>
              </div>
            )}

            {invoice.status === 'partially_paid' && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Balance Due:</span>
                <span className="font-medium text-red-400">
                  {formatCurrency(invoice.total - invoice.paidAmount, invoice.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 py-6 bg-white border-t border-brand-gray/20 flex justify-end gap-4">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center px-6 py-2.5 border border-gray-300 text-brand-text-primary rounded-xl hover:bg-brand-gray/5 transition-all font-medium disabled:opacity-50 text-sm"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>

          {(invoice.status === 'unpaid' || invoice.status === 'partially_paid') && (
            <button
              onClick={handlePayNow}
              className="flex items-center px-6 py-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-green-hover transition-all font-bold text-sm shadow-sm"
            >
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Pay Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
