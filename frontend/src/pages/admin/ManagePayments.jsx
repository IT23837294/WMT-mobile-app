import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, 
  DollarSign, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  Mail,
  RotateCcw
} from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  card: 'Card Payment',
  online: 'Online Payment',
  bank_deposit: 'Bank Deposit'
};

const RECEIPT_STATUS_LABELS = {
  not_registered: 'Not Registered',
  registered: 'Registered',
  sent: 'Sent'
};

const REFUND_STATUS_LABELS = {
  not_applicable: 'Eligible',
  pending: 'Pending Review',
  processed: 'Refunded'
};

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;
const getReceiptImageSources = (items = []) => (
  items
    .map((item) => item?.medicine?.image)
    .filter(Boolean)
    .slice(0, 3)
);
const receiptLogoMarkup = `
  <div style="display:flex; align-items:center; gap:14px;">
    <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="invoiceLogoBg" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0F766E" />
          <stop offset="1" stop-color="#1D4ED8" />
        </linearGradient>
        <linearGradient id="invoiceLogoCapsule" x1="22" y1="18" x2="43" y2="41" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E0F2FE" />
          <stop offset="1" stop-color="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="18" fill="url(#invoiceLogoBg)" />
      <path d="M17 32C17 23.716 23.716 17 32 17C40.284 17 47 23.716 47 32C47 40.284 40.284 47 32 47C23.716 47 17 40.284 17 32Z" fill="white" fill-opacity="0.14" />
      <path d="M39.778 19.561C43.846 20.684 47 24.772 47 29.503C47 34.857 42.971 39.315 37.741 39.91L36.594 41.922C35.926 43.094 34.68 43.818 33.33 43.818H30.67C29.32 43.818 28.074 43.094 27.406 41.922L26.259 39.91C21.029 39.315 17 34.857 17 29.503C17 24.772 20.154 20.684 24.222 19.561C25.684 19.157 26.986 20.564 26.467 21.988L24.629 27.037C24.324 27.875 24.749 28.795 25.582 29.114L30.209 30.887C31.358 31.328 32.642 31.328 33.791 30.887L38.418 29.114C39.251 28.795 39.676 27.875 39.371 27.037L37.533 21.988C37.014 20.564 38.316 19.157 39.778 19.561Z" fill="url(#invoiceLogoCapsule)" />
      <path d="M31.999 23V35" stroke="#0F766E" stroke-width="3.5" stroke-linecap="round" />
      <path d="M26 29H38" stroke="#0F766E" stroke-width="3.5" stroke-linecap="round" />
      <path d="M42.5 16.5C45.1 16.9 47.2 18.9 47.8 21.5" stroke="#A7F3D0" stroke-width="2.5" stroke-linecap="round" />
    </svg>
    <div style="font-size:20px; font-weight:800; color:#18324b; letter-spacing:-0.02em;">PharmaCare</div>
  </div>
`;

const buildProfessionalReceiptHtml = (payment) => {
  const address = payment.deliveryAddress
    ? [
      payment.deliveryAddress.street,
      `${payment.deliveryAddress.city}, ${payment.deliveryAddress.state} ${payment.deliveryAddress.zipCode}`,
      payment.deliveryAddress.country || 'Sri Lanka'
    ].filter(Boolean).join('<br />')
    : 'No address provided';
  const backgroundImages = getReceiptImageSources(payment.items);
  const itemsRows = (payment.items || []).map((item) => `
    <tr>
      <td style="text-align: center;">${item.quantity}</td>
      <td>${item.medicine?.name || 'Medicine'}</td>
      <td style="text-align: right;">${formatCurrency(item.price)}</td>
      <td style="text-align: right; font-weight: 700;">${formatCurrency(item.total || (item.price * item.quantity))}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>Pharmacare Invoice ${payment.orderId}</title>
        <style>
          body {
            margin: 0;
            padding: 24px 0;
            background: #eef5f7;
            color: #1e293b;
            font-family: Arial, sans-serif;
          }
          .receipt-shell {
            max-width: 760px;
            margin: 0 auto;
            background: #ffffff;
            border: 4px solid #6aa6ae;
            overflow: hidden;
            position: relative;
          }
          .watermark-layer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
          }
          .watermark-layer img {
            position: absolute;
            width: 170px;
            height: 170px;
            object-fit: contain;
            opacity: 0.08;
            filter: grayscale(100%);
          }
          .watermark-one {
            top: 150px;
            right: 18px;
            transform: rotate(-18deg);
          }
          .watermark-two {
            bottom: 120px;
            left: 22px;
            transform: rotate(14deg);
          }
          .watermark-three {
            top: 360px;
            left: 240px;
            transform: rotate(-10deg);
          }
          .shape-top {
            position: absolute;
            top: 18px;
            right: 32px;
            width: 160px;
            height: 56px;
            transform: skew(-28deg);
            background: rgba(106,166,174,0.12);
          }
          .shape-top-thin {
            position: absolute;
            top: 0;
            right: 86px;
            width: 20px;
            height: 70px;
            transform: skew(-28deg);
            background: rgba(106,166,174,0.16);
          }
          .shape-bottom-left,
          .shape-bottom-right {
            position: absolute;
            bottom: 18px;
            height: 24px;
            transform: skew(-28deg);
            border: 2px solid rgba(106,166,174,0.18);
          }
          .shape-bottom-left {
            left: 26px;
            width: 76px;
          }
          .shape-bottom-right {
            right: 26px;
            width: 90px;
          }
          .content {
            padding: 34px 28px 18px;
            position: relative;
            z-index: 1;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .logo {
            font-size: 15px;
            font-weight: 700;
            color: #2f6f7a;
            margin-bottom: 10px;
          }
          .title {
            font-size: 34px;
            font-weight: 800;
            letter-spacing: 0.02em;
            color: #18324b;
            text-transform: none;
          }
          .receipt-meta {
            text-align: right;
            color: #7c8a9a;
            font-size: 13px;
            line-height: 1.7;
          }
          .info-grid, .items-grid, .summary-grid {
            width: 100%;
            border-collapse: collapse;
          }
          .small-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 6px;
          }
          .info-text {
            font-size: 13px;
            line-height: 1.6;
          }
          .items-grid thead tr {
            background: #dbe8ec;
            color: #334155;
          }
          .items-grid th {
            padding: 10px 12px;
            font-size: 12px;
          }
          .items-grid td {
            padding: 10px 12px;
            font-size: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals-box {
            border: 1px solid #cbd5e1;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 9px 12px;
            font-size: 12px;
            border-bottom: 1px solid #cbd5e1;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            padding: 11px 12px;
            font-size: 13px;
            background: #18324b;
            color: #ffffff;
            font-weight: 700;
          }
          .signature {
            margin-top: 42px;
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .receipt-shell {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-shell">
          <div class="watermark-layer">
            ${backgroundImages[0] ? `<img src="${backgroundImages[0]}" alt="" class="watermark-one" />` : ''}
            ${backgroundImages[1] ? `<img src="${backgroundImages[1]}" alt="" class="watermark-two" />` : ''}
            ${backgroundImages[2] ? `<img src="${backgroundImages[2]}" alt="" class="watermark-three" />` : ''}
          </div>
          <div class="shape-top"></div>
          <div class="shape-top-thin"></div>
          <div class="shape-bottom-left"></div>
          <div class="shape-bottom-right"></div>
          <div class="content">
            <div class="header">
              <div>
                ${receiptLogoMarkup}
                <div class="title">Pharmacare Invoice</div>
              </div>
              <div class="receipt-meta">
                <div><strong>Receipt #</strong> ${payment.orderId}</div>
                <div><strong>Date</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Time</strong> ${new Date().toLocaleTimeString()}</div>
              </div>
            </div>

            <table class="info-grid" style="margin-bottom: 18px;">
              <tr>
                <td style="width: 34%; vertical-align: top; padding-right: 16px;">
                  <div class="small-label">Bill To</div>
                  <div class="info-text">
                    <strong>${payment.customer}</strong><br />
                    ${payment.receiptEmail || payment.email || 'No receipt email'}<br />
                    ${payment.contactNumber || 'No contact'}
                  </div>
                </td>
                <td style="width: 33%; vertical-align: top; padding-right: 16px;">
                  <div class="small-label">Ship To</div>
                  <div class="info-text">${address}</div>
                </td>
                <td style="width: 33%; vertical-align: top;">
                  <div class="small-label">Receipt Info</div>
                  <div class="info-text">
                    <strong>Payment</strong> ${payment.paymentMethodLabel}<br />
                    <strong>Status</strong> ${payment.paymentStatus}<br />
                    <strong>Reference</strong> ${payment.paymentReference || payment.transactionId || 'N/A'}
                  </div>
                </td>
              </tr>
            </table>

            <table class="items-grid" style="margin-bottom: 18px;">
              <thead>
                <tr>
                  <th style="text-align: center;">QTY</th>
                  <th style="text-align: left;">DESCRIPTION</th>
                  <th style="text-align: right;">PRICE</th>
                  <th style="text-align: right;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>${itemsRows || `
                <tr>
                  <td style="text-align: center;">1</td>
                  <td>Customer pharmacy order ${payment.orderId}</td>
                  <td style="text-align: right;">${formatCurrency(payment.subtotal)}</td>
                  <td style="text-align: right; font-weight: 700;">${formatCurrency(payment.subtotal)}</td>
                </tr>
              `}</tbody>
            </table>

            <table class="summary-grid" style="margin-top: 26px;">
              <tr>
                <td style="width: 58%; vertical-align: bottom; padding-right: 20px;">
                  <div class="small-label" style="color:#475569;">Term & Condition</div>
                  <div style="font-size: 11px; color: #64748b; line-height: 1.6; max-width: 300px;">
                    This is a system-generated invoice from PharmaCare. Please retain this document as payment proof for your pharmacy order.
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: #18324b; margin-top: 16px;">WWW.PHARMACARE.COM</div>
                </td>
                <td style="width: 42%; vertical-align: top;">
                  <div class="totals-box">
                    <div class="totals-row"><span>Sub Total</span><strong>${formatCurrency(payment.subtotal)}</strong></div>
                    <div class="totals-row"><span>Delivery Charge</span><strong>${formatCurrency(payment.deliveryCharge)}</strong></div>
                    <div class="totals-row"><span>Discount</span><strong>${formatCurrency(payment.discount)}</strong></div>
                    <div class="grand-total"><span>GRAND TOTAL</span><span>${formatCurrency(payment.amount)}</span></div>
                  </div>
                  <div class="signature">
                    <div style="border-top: 1px solid #94a3b8; width: 170px; margin-left: auto; margin-bottom: 6px;"></div>
                    Signature
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
};

const ManagePayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [refundFilter, setRefundFilter] = useState('actionable');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [receiptDrafts, setReceiptDrafts] = useState({});
  const [refundDrafts, setRefundDrafts] = useState({});
  const [savingReceiptId, setSavingReceiptId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    failed: 0,
    totalAmount: 0,
    receiptRegistered: 0,
    refundsPending: 0,
    refundsProcessed: 0
  });

  const isSupportOfficer = user?.role === 'support_officer';
  const canManagePaymentStatus = user?.role === 'admin';
  const canManageReceipts = user?.role === 'admin';
  const canManageRefunds = isSupportOfficer;
  const paidCustomers = payments.filter(payment => payment.paymentStatus === 'paid');
  const officerRefundPayments = payments.filter((payment) => (
    payment.refundStatus === 'pending' ||
    payment.refundStatus === 'processed' ||
    payment.paymentStatus === 'paid'
  ));

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, methodFilter, refundFilter, isSupportOfficer]);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/api/orders');
      const orders = response.data.orders || [];
      
      // Extract payment data from orders
      const paymentData = orders.map(order => ({
        id: order._id,
        orderId: order.orderNumber,
        customer: order.user?.name || 'Unknown',
        email: order.user?.email || '',
        amount: order.finalAmount,
        subtotal: order.totalAmount || 0,
        deliveryCharge: order.deliveryCharge || 0,
        discount: order.discount || 0,
        contactNumber: order.contactNumber || order.user?.phone || '',
        items: order.items || [],
        paymentMethod: order.paymentMethod || 'cod',
        paymentMethodLabel: PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || 'Cash on Delivery',
        paymentStatus: order.paymentStatus || 'pending',
        orderStatus: order.orderStatus,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        transactionId: order.transactionId || null,
        paymentReference: order.paymentReference || null,
        receiptEmail: order.receiptEmail || order.user?.email || '',
        receiptStatus: order.receiptStatus || 'not_registered',
        receiptRegisteredAt: order.receiptRegisteredAt || null,
        receiptSentAt: order.receiptSentAt || null,
        refundStatus: order.refundStatus || 'not_applicable',
        refundAmount: order.refundAmount || order.finalAmount || 0,
        refundReason: order.refundReason || 'Customer rejected the delivery',
        refundProcessedAt: order.refundProcessedAt || null
      }));

      setPayments(paymentData);
      setReceiptDrafts(
        paymentData.reduce((drafts, payment) => {
          drafts[payment.id] = payment.receiptEmail || '';
          return drafts;
        }, {})
      );
      setRefundDrafts(
        paymentData.reduce((drafts, payment) => {
          drafts[payment.id] = {
            refundAmount: payment.refundAmount || payment.amount || 0,
            refundReason: payment.refundReason || 'Customer rejected the delivery'
          };
          return drafts;
        }, {})
      );
      
      // Calculate stats
      const pending = paymentData.filter(p => p.paymentStatus === 'pending').length;
      const paid = paymentData.filter(p => p.paymentStatus === 'paid').length;
      const failed = paymentData.filter(p => p.paymentStatus === 'failed').length;
      const totalAmount = paymentData
        .filter(p => p.paymentStatus === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const receiptRegistered = paymentData.filter(p => p.receiptStatus !== 'not_registered').length;
      const refundsPending = paymentData.filter(p => p.refundStatus === 'pending').length;
      const refundsProcessed = paymentData.filter(p => p.refundStatus === 'processed').length;

      setStats({
        total: paymentData.length,
        pending,
        paid,
        failed,
        totalAmount,
        receiptRegistered,
        refundsPending,
        refundsProcessed
      });
    } catch (err) {
      setError('Failed to load payments');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = isSupportOfficer ? officerRefundPayments : payments;

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!isSupportOfficer && statusFilter !== 'all') {
      filtered = filtered.filter(p => p.paymentStatus === statusFilter);
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === methodFilter);
    }

    if (isSupportOfficer && refundFilter !== 'all') {
      filtered = filtered.filter((payment) => {
        if (refundFilter === 'actionable') {
          return payment.paymentStatus === 'paid' && payment.refundStatus !== 'processed';
        }

        if (refundFilter === 'pending') {
          return payment.refundStatus === 'pending';
        }

        if (refundFilter === 'processed') {
          return payment.refundStatus === 'processed';
        }

        if (refundFilter === 'eligible') {
          return payment.paymentStatus === 'paid' && payment.refundStatus === 'not_applicable';
        }

        return true;
      });
    }

    setFilteredPayments(filtered);
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await axios.put(`/api/orders/${paymentId}/status`, {
        paymentStatus: newStatus
      });
      fetchPayments();
    } catch (err) {
      setError('Failed to update payment status');
    }
  };

  const saveReceiptEmail = async (payment) => {
    const receiptEmail = receiptDrafts[payment.id]?.trim();

    if (!receiptEmail) {
      setError('Please enter a receipt email before saving');
      return;
    }

    setSavingReceiptId(payment.id);
    try {
      await axios.put(`/api/orders/${payment.id}/receipt`, {
        receiptEmail,
        receiptStatus: 'registered'
      });
      await fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save receipt email');
    } finally {
      setSavingReceiptId(null);
    }
  };

  const markReceiptSent = async (paymentId) => {
    setSavingReceiptId(paymentId);
    try {
      await axios.put(`/api/orders/${paymentId}/receipt`, {
        receiptStatus: 'sent'
      });
      await fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update receipt status');
    } finally {
      setSavingReceiptId(null);
    }
  };

  const updateRefundField = (paymentId, field, value) => {
    setRefundDrafts((current) => ({
      ...current,
      [paymentId]: {
        ...current[paymentId],
        [field]: value
      }
    }));
  };

  const processRefund = async (payment) => {
    const refundDraft = refundDrafts[payment.id] || {};
    const safeRefundAmount = Number(refundDraft.refundAmount);

    if (Number.isNaN(safeRefundAmount) || safeRefundAmount <= 0) {
      setError('Refund amount must be greater than 0');
      return;
    }

    if (safeRefundAmount > Number(payment.amount || 0)) {
      setError('Refund amount cannot be greater than the paid amount');
      return;
    }

    if (!String(refundDraft.refundReason || '').trim()) {
      setError('Please add a refund reason before processing the refund');
      return;
    }

    try {
      setError('');
      await axios.put(`/api/orders/${payment.id}/refund`, {
        refundAmount: safeRefundAmount,
        refundReason: refundDraft.refundReason.trim()
      });
      await fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process refund');
    }
  };

  const downloadReceipt = (payment) => {
    const receiptWindow = window.open('', '_blank', 'width=900,height=700');

    if (!receiptWindow) {
      setError('Please allow pop-ups to generate the receipt');
      return;
    }

    receiptWindow.document.write(buildProfessionalReceiptHtml(payment));
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getReceiptStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRefundStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={isSupportOfficer ? 'Refund Control' : 'Payment Management'}
        subtitle={isSupportOfficer
          ? 'Review paid orders, monitor pending refund cases, and process customer refunds from one screen.'
          : 'Track payment outcomes, e-receipt registration, customer billing activity, and professional invoice generation from one screen.'}
        icon={CreditCard}
        stats={isSupportOfficer
          ? [
            { label: 'Paid Orders', value: stats.paid },
            { label: 'Refund Queue', value: stats.refundsPending },
            { label: 'Refunded', value: stats.refundsProcessed },
            { label: 'Coverage', value: formatCurrency(stats.totalAmount) }
          ]
          : [
            { label: 'Payments', value: stats.total },
            { label: 'Paid', value: stats.paid },
            { label: 'Revenue', value: formatCurrency(stats.totalAmount) },
            { label: 'E-Receipts', value: stats.receiptRegistered }
          ]}
      />

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 ${isSupportOfficer ? 'md:grid-cols-4' : 'md:grid-cols-5'} gap-6 mb-6`}>
        <div className="card">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">{isSupportOfficer ? 'Pending Refunds' : 'Pending'}</p>
              <p className="text-2xl font-bold text-gray-900">{isSupportOfficer ? stats.refundsPending : stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`${isSupportOfficer ? 'bg-red-100' : 'bg-medical-100'} p-3 rounded-lg`}>
              <DollarSign className={`h-6 w-6 ${isSupportOfficer ? 'text-red-600' : 'text-medical-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">{isSupportOfficer ? 'Refunded Orders' : 'Total Revenue'}</p>
              <p className="text-2xl font-bold text-gray-900">{isSupportOfficer ? stats.refundsProcessed : formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </div>

        {!isSupportOfficer && (
          <div className="card">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">E-Receipts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.receiptRegistered}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`card mb-6 ${isSupportOfficer ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{isSupportOfficer ? 'Refund Queue Overview' : 'Customers Who Paid Their Own Bills'}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isSupportOfficer
                ? `${stats.refundsPending} order refund case${stats.refundsPending !== 1 ? 's are' : ' is'} waiting for action`
                : `${paidCustomers.length} paid customer payment${paidCustomers.length !== 1 ? 's' : ''} recorded`}
            </p>
          </div>
          <div className="text-sm text-gray-700">
            {isSupportOfficer ? (
              <>Refund-ready orders: <span className="font-semibold">{officerRefundPayments.filter((payment) => payment.paymentStatus === 'paid' && payment.refundStatus !== 'processed').length}</span></>
            ) : (
              <>Registered e-receipts: <span className="font-semibold">{stats.receiptRegistered}</span></>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={isSupportOfficer ? 'Search by order ID, customer, email, or phone...' : 'Search by order ID, customer...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          {isSupportOfficer ? (
            <select
              value={refundFilter}
              onChange={(e) => setRefundFilter(e.target.value)}
              className="input w-full md:w-56"
            >
              <option value="actionable">Actionable Refunds</option>
              <option value="pending">Pending Review</option>
              <option value="eligible">Eligible Paid Orders</option>
              <option value="processed">Processed Refunds</option>
              <option value="all">All Refund Cases</option>
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full md:w-48"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          )}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="all">All Methods</option>
            <option value="cod">Cash on Delivery</option>
            <option value="card">Card Payment</option>
            <option value="online">Online Payment</option>
            <option value="bank_deposit">Bank Deposit</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                {canManageReceipts && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-Receipt
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isSupportOfficer ? 'Refund Stage' : 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <React.Fragment key={payment.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{payment.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{payment.customer}</div>
                      <div className="text-xs text-gray-400">{payment.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.paymentMethodLabel}
                    </td>
                    {canManageReceipts && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>{payment.receiptEmail || 'Not registered'}</div>
                        <div className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getReceiptStatusColor(payment.receiptStatus)}`}>
                          {RECEIPT_STATUS_LABELS[payment.receiptStatus] || 'Not Registered'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSupportOfficer ? (
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRefundStatusColor(payment.refundStatus)}`}>
                            {REFUND_STATUS_LABELS[payment.refundStatus] || 'Eligible'}
                          </span>
                          <div className="text-xs text-gray-500">
                            Payment: <span className="capitalize">{payment.paymentStatus}</span>
                          </div>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.paymentStatus)}`}>
                          {getStatusIcon(payment.paymentStatus)}
                          <span className="ml-1 capitalize">{payment.paymentStatus}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setExpandedPayment(expandedPayment === payment.id ? null : payment.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {expandedPayment === payment.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        {canManagePaymentStatus && payment.paymentStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'paid')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'failed')}
                              className="text-red-600 hover:text-red-900"
                              title="Mark as Failed"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedPayment === payment.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={canManageReceipts ? '8' : '7'} className="px-6 py-4">
                        <div className={`grid grid-cols-1 ${canManageReceipts ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-gray-600">Transaction ID:</span> {payment.transactionId || 'N/A'}</p>
                              <p><span className="text-gray-600">Payment Reference:</span> {payment.paymentReference || 'N/A'}</p>
                              <p><span className="text-gray-600">Order Status:</span> <span className="capitalize">{payment.orderStatus}</span></p>
                              <p><span className="text-gray-600">Payment Method:</span> {payment.paymentMethodLabel}</p>
                              <p><span className="text-gray-600">Contact:</span> {payment.contactNumber || 'N/A'}</p>
                              <p>
                                <span className="text-gray-600">Refund Status:</span>{' '}
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getRefundStatusColor(payment.refundStatus)}`}>
                                  {REFUND_STATUS_LABELS[payment.refundStatus] || 'Eligible'}
                                </span>
                              </p>
                              <p><span className="text-gray-600">Refund Reason:</span> {payment.refundReason || 'Not provided yet'}</p>
                              {payment.refundProcessedAt && (
                                <p><span className="text-gray-600">Refunded At:</span> {new Date(payment.refundProcessedAt).toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                            <div className="text-sm text-gray-600">
                              {payment.deliveryAddress ? (
                                <>
                                  <p>{payment.deliveryAddress.street}</p>
                                  <p>{payment.deliveryAddress.city}, {payment.deliveryAddress.state}</p>
                                  <p>{payment.deliveryAddress.zipCode}</p>
                                </>
                              ) : 'No address provided'}
                            </div>
                          </div>
                          {canManageReceipts && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">E-Receipt Registration</h4>
                              <div className="space-y-3">
                                <input
                                  type="email"
                                  value={receiptDrafts[payment.id] || ''}
                                  onChange={(e) => setReceiptDrafts((current) => ({
                                    ...current,
                                    [payment.id]: e.target.value
                                  }))}
                                  placeholder="customer@email.com"
                                  className="input"
                                  disabled
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => downloadReceipt(payment)}
                                    className="btn-secondary flex items-center space-x-2"
                                  >
                                    <Download className="h-4 w-4" />
                                    <span>Download Receipt</span>
                                  </button>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <p>Registered at: {payment.receiptRegisteredAt ? new Date(payment.receiptRegisteredAt).toLocaleString() : 'Not yet registered'}</p>
                                  <p>Sent at: {payment.receiptSentAt ? new Date(payment.receiptSentAt).toLocaleString() : 'Not sent yet'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {canManageRefunds && (
                          <div className="mt-6 border-t pt-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <RotateCcw className="h-4 w-4" />
                            {isSupportOfficer ? 'Customer Refund Action' : 'Refund Management'}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {payment.refundStatus === 'processed'
                              ? 'This customer refund has already been completed and recorded.'
                              : 'Review the customer order, confirm the amount, and apply the refund when ready.'}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Refund amount"
                              value={refundDrafts[payment.id]?.refundAmount || ''}
                              onChange={(e) => updateRefundField(payment.id, 'refundAmount', e.target.value)}
                              className="input"
                            />
                            <input
                              type="text"
                              placeholder="Refund reason"
                              value={refundDrafts[payment.id]?.refundReason || ''}
                              onChange={(e) => updateRefundField(payment.id, 'refundReason', e.target.value)}
                              className="input md:col-span-2"
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => processRefund(payment)}
                              disabled={payment.paymentStatus !== 'paid' || payment.refundStatus === 'processed'}
                              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RotateCcw className="h-4 w-4" />
                              {payment.refundStatus === 'processed' ? 'Refund Processed' : isSupportOfficer ? 'Apply Refund for Customer' : 'Process Refund'}
                            </button>
                            <span className="text-sm text-gray-600">
                              Maximum refundable amount: {formatCurrency(payment.amount)}
                            </span>
                          </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPayments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No payments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePayments;
