import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Building2, ClipboardList, Factory, FileText, Truck, BarChart3, MessageSquare, Send } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import useSupplierDashboardData from './useSupplierDashboardData';
import { formatCurrency, formatCount } from './supplierDashboardUtils';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SupplierDashboard = () => {
  const { user } = useAuth();
  const {
    supplierData,
    supplier,
    stats,
    performance,
    loading,
    error
  } = useSupplierDashboardData();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [showTickets, setShowTickets] = useState(false);

  useEffect(() => {
    fetchSupplierTickets();
  }, []);

  const fetchSupplierTickets = async () => {
    try {
      const response = await axios.get('/api/tickets/supplier/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTickets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setMessageLoading(true);
    try {
      await axios.post(`/api/tickets/${selectedTicket._id}/supplier-message`, {
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success('Message sent successfully');
      setNewMessage('');

      // Refresh ticket
      const response = await axios.get(`/api/tickets/${selectedTicket._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedTicket(response.data.data);
      fetchSupplierTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-medical-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Supplier Dashboard"
          subtitle="A focused workspace for suppliers to track their catalog, orders, and payment standing."
          eyebrow="Supplier Portal"
          icon={Factory}
          stats={[
            { label: 'Signed in as', value: user?.name || 'Supplier' },
            { label: 'Account', value: user?.role || 'supplier' }
          ]}
        />

        <div className="card border border-amber-200 bg-amber-50/70">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Supplier profile not linked yet</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Supplier Dashboard"
        subtitle="Use the sidebar to move between supplier profile, catalog, orders, invoices, and performance pages."
        eyebrow="Supplier Portal"
        icon={Factory}
        stats={[
          { label: 'Catalog items', value: supplierData?.stats?.catalogItems ?? 0 },
          { label: 'Open orders', value: supplierData?.stats?.openOrders ?? 0 },
          { label: 'Invoices due', value: supplierData?.stats?.overdueInvoices ?? 0 },
          { label: 'Performance', value: `${Number(performance.rating || 0).toFixed(1)} / 5` }
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="card">
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-3 ${stat.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Supplier workspace</h2>
            <p className="mt-1 text-sm text-slate-500">
              Open the section you need instead of scrolling through a single long dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                name: 'Supplier Details',
                path: '/supplier/details',
                icon: Building2,
                description: 'Company, contact, terms, and account status'
              },
              {
                name: 'Catalog',
                path: '/supplier/catalog',
                icon: ClipboardList,
                description: 'Products currently linked to this supplier'
              },
              {
                name: 'Orders',
                path: '/supplier/orders',
                icon: Truck,
                description: 'Purchase order list and line-level detail'
              },
              {
                name: 'Invoices',
                path: '/supplier/invoices',
                icon: FileText,
                description: 'Invoice amounts, paid values, and status'
              },
              {
                name: 'Performance',
                path: '/supplier/performance',
                icon: BarChart3,
                description: 'Ratings, statement history, and top products'
              },
              {
                name: 'Support Tickets',
                path: '#',
                icon: MessageSquare,
                description: 'View and respond to support tickets',
                onClick: () => setShowTickets(!showTickets)
              }
            ].map((item) => {
              const Icon = item.icon;

              if (item.onClick) {
                return (
                  <button
                    key={item.name}
                    onClick={item.onClick}
                    className="group w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50/50 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white p-3 text-teal-700 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-600" />
                    </div>
                  </button>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white p-3 text-teal-700 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-600" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Current snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">Quick summary of the linked supplier record.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Company</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{supplier?.companyName || 'Company name not set'}</p>
              <p className="mt-1 text-sm text-slate-600">{supplier?.name || 'Supplier profile'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Performance</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{Number(performance.rating || 0).toFixed(1)}<span className="text-base font-semibold text-slate-500"> / 5</span></p>
              <p className="mt-1 text-sm text-slate-600">On-time delivery {Number(performance.onTimeDeliveryRate || 0).toFixed(0)}%</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Highlights</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Catalog items</span>
                <span className="font-semibold">{formatCount(supplierData?.stats?.catalogItems ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Open orders</span>
                <span className="font-semibold">{formatCount(supplierData?.stats?.openOrders ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Invoices due</span>
                <span className="font-semibold">{formatCount(supplierData?.stats?.overdueInvoices ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Outstanding balance</span>
                <span className="font-semibold">{formatCurrency(supplierData?.stats?.outstandingBalance ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Tickets Section */}
      {showTickets && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Support Tickets</h2>
              <p className="mt-1 text-sm text-slate-500">View and respond to tickets from support officers</p>
            </div>
            <button
              onClick={() => setShowTickets(false)}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              No support tickets assigned to your supplier account.
            </div>
          ) : selectedTicket ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-sm text-medical-600 hover:text-medical-700"
              >
                ← Back to tickets
              </button>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Ticket Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Ticket ID</p>
                    <p className="font-medium text-slate-900">#{selectedTicket._id.slice(-6)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Subject</p>
                    <p className="font-medium text-slate-900">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Category</p>
                    <p className="font-medium text-slate-900">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedTicket.status === 'open' ? 'bg-red-100 text-red-800' :
                      selectedTicket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Message History</h3>
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          msg.sender === 'support'
                            ? 'bg-blue-100 ml-8'
                            : 'bg-green-100 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">
                            {msg.sender === 'support' ? 'Support Officer' : 'You'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800">{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No messages yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Send Response
                </h3>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  placeholder="Type your response..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 mb-3"
                />
                <button
                  onClick={sendMessage}
                  disabled={messageLoading || !newMessage.trim()}
                  className="px-4 py-2 bg-medical-600 text-white font-medium rounded-md hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {messageLoading ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:border-teal-300 hover:bg-teal-50/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">#{ticket._id.slice(-6)} - {ticket.subject}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                      ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  {ticket.messages && ticket.messages.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierDashboard;
