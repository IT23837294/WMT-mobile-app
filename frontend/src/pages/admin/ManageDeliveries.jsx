import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Search, 
  CheckCircle, 
  Clock,
  Package,
  Phone,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;
const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  card: 'Card Payment',
  online: 'Online Payment',
  bank_deposit: 'Bank Deposit'
};

const buildAdminTrackingUrl = (order) => order?.trackingUrl || `/customer/orders/${order._id}`;

const ManageDeliveries = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    totalDeliveryCharges: 0
  });
  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      const ordersData = response.data.orders || [];
      setOrders(ordersData);
      // Calculate stats
      const pending = ordersData.filter(o => o.orderStatus === 'pending').length;
      const processing = ordersData.filter(o => o.orderStatus === 'processing').length;
      const shipped = ordersData.filter(o => o.orderStatus === 'shipped').length;
      const delivered = ordersData.filter(o => o.orderStatus === 'delivered').length;
      const totalDeliveryCharges = ordersData.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

      setStats({
        total: ordersData.length,
        pending,
        processing,
        shipped,
        delivered,
        totalDeliveryCharges
      });
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.orderStatus === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingStatusText = (order) => {
    if (order.orderStatus === 'delivered') {
      return 'Delivered successfully';
    }

    if (order.orderStatus === 'shipped') {
      return 'Package is in transit';
    }

    if (order.orderStatus === 'rejected') {
      return 'Delivery was rejected by the customer';
    }

    if (order.orderStatus === 'cancelled') {
      return 'Delivery was cancelled before dispatch';
    }

    if (order.trackingNumber) {
      return 'Tracking has been created for this order';
    }

    return 'Tracking will be created automatically';
  };

  const getTrackingFlowSteps = (order) => {
    const isCancelled = order.orderStatus === 'cancelled';
    const isRejected = order.orderStatus === 'rejected';

    return [
      {
        key: 'placed',
        label: 'Order Placed',
        detail: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Order created',
        active: true,
        tone: 'green'
      },
      {
        key: 'tracking',
        label: 'Tracking Created',
        detail: order.trackingNumber || 'Tracking number generated automatically',
        active: Boolean(order.trackingNumber),
        tone: 'blue'
      },
      {
        key: 'processing',
        label: 'Preparing',
        detail: order.paymentStatus === 'paid' ? 'Payment confirmed and packing started' : 'Awaiting payment confirmation',
        active: order.paymentStatus === 'paid' || ['processing', 'shipped', 'delivered'].includes(order.orderStatus),
        tone: 'amber'
      },
      {
        key: 'shipped',
        label: 'In Transit',
        detail: order.shippedAt ? new Date(order.shippedAt).toLocaleString() : 'Not shipped yet',
        active: ['shipped', 'delivered'].includes(order.orderStatus),
        tone: 'blue'
      },
      {
        key: 'final',
        label: isCancelled ? 'Cancelled' : isRejected ? 'Rejected' : 'Delivered',
        detail: isCancelled
          ? 'Order cancelled before dispatch'
          : isRejected
            ? 'Customer rejected the delivery'
            : order.deliveredAt
              ? new Date(order.deliveredAt).toLocaleString()
              : 'Waiting for final delivery',
        active: ['delivered', 'cancelled', 'rejected'].includes(order.orderStatus),
        tone: isCancelled || isRejected ? 'red' : 'green'
      }
    ];
  };

  const getFlowToneClasses = (step) => {
    if (step.tone === 'red') {
      return step.active ? 'bg-red-500 border-red-500 text-red-700' : 'bg-red-100 border-red-200 text-red-400';
    }

    if (step.tone === 'amber') {
      return step.active ? 'bg-amber-500 border-amber-500 text-amber-700' : 'bg-amber-100 border-amber-200 text-amber-400';
    }

    if (step.tone === 'blue') {
      return step.active ? 'bg-blue-500 border-blue-500 text-blue-700' : 'bg-blue-100 border-blue-200 text-blue-400';
    }

    return step.active ? 'bg-green-500 border-green-500 text-green-700' : 'bg-green-100 border-green-200 text-green-400';
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
        title="Delivery Management"
        subtitle="Oversee shipping progress, customer delivery status, and courier tracking from a unified logistics dashboard."
        icon={Truck}
        stats={[
          { label: 'Orders', value: stats.total },
          { label: 'Processing', value: stats.processing },
          { label: 'Shipped', value: stats.shipped },
          { label: 'Delivered', value: stats.delivered }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Orders</p>
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
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Shipped</p>
              <p className="text-2xl font-bold text-gray-900">{stats.shipped}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Delivery Charges */}
      <div className="card mb-6 bg-medical-50 border-medical-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-medical-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-medical-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Delivery Charges Collected</p>
              <p className="text-2xl font-bold text-medical-700">{formatCurrency(stats.totalDeliveryCharges)}</p>
            </div>
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
              placeholder="Search by order ID, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
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
                  Delivery Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Charge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{order.user?.name}</div>
                      <div className="text-xs text-gray-400">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {order.deliveryAddress ? (
                        <div>
                          <p>{order.deliveryAddress.street}</p>
                          <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}</p>
                        </div>
                      ) : 'No address'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {order.contactNumber || order.user?.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(order.deliveryCharge)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {expandedOrder === order._id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === order._id && (
                    <tr className="bg-gray-50">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                            <div className="space-y-2 text-sm">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{item.medicine?.name} x {item.quantity}</span>
                                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-medium">
                                  <span>Subtotal:</span>
                                  <span>{formatCurrency(order.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery:</span>
                                  <span>{formatCurrency(order.deliveryCharge)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-medical-600">
                                  <span>Total:</span>
                                  <span>{formatCurrency(order.finalAmount)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><span className="font-medium">Method:</span> {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || 'Cash on Delivery'}</p>
                              <p><span className="font-medium">Status:</span> <span className="capitalize">{order.paymentStatus || 'pending'}</span></p>
                              <p><span className="font-medium">Order Date:</span> {new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Delivery Timeline</h4>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <div className={`w-3 h-3 rounded-full mr-2 ${order.orderStatus ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <span>Order Placed</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <div className={`w-3 h-3 rounded-full mr-2 ${['processing', 'shipped', 'delivered'].includes(order.orderStatus) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span>Processing</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <div className={`w-3 h-3 rounded-full mr-2 ${['shipped', 'delivered'].includes(order.orderStatus) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span>Shipped</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <div className={`w-3 h-3 rounded-full mr-2 ${order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span>Delivered</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <div className={`w-3 h-3 rounded-full mr-2 ${order.orderStatus === 'rejected' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                <span>Rejected</span>
                              </div>
                              {order.trackingUpdatedAt && (
                                <div className="flex items-center text-sm text-gray-500 pt-2">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Tracking updated {new Date(order.trackingUpdatedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 border-t pt-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Delivery Tracking
                          </h4>
                          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Virtual Delivery Flow</p>
                                <p className="text-sm text-slate-600">Live visual order movement from placement to final delivery.</p>
                              </div>
                              <a
                                href={buildAdminTrackingUrl(order)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                              >
                                Open Tracking Link
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                            <div className="space-y-4">
                              {getTrackingFlowSteps(order).map((step, index, steps) => (
                                <div key={step.key} className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className={`h-4 w-4 rounded-full border-4 ${getFlowToneClasses(step).split(' ').slice(0, 2).join(' ')}`}></div>
                                    {index !== steps.length - 1 && (
                                      <div className={`mt-1 w-0.5 flex-1 ${step.active ? 'bg-slate-300' : 'bg-slate-200'}`}></div>
                                    )}
                                  </div>
                                  <div className="pb-4">
                                    <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                                    <p className="text-sm text-slate-600">{step.detail}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm text-blue-900">
                              <div>
                                <p className="font-semibold">Tracking Status</p>
                                <p className="font-normal text-blue-800">{getTrackingStatusText(order)}</p>
                              </div>
                              <div>
                                <p><span className="font-semibold">Order No:</span> {order.orderNumber || 'Generating order number...'}</p>
                                <p><span className="font-semibold">Tracking Number:</span> {order.trackingNumber || 'Generating tracking...'}</p>
                              </div>
                              <div>
                                <p><span className="font-semibold">Courier:</span> {order.trackingCarrier || 'PharmaCare Courier'}</p>
                              </div>
                              <div>
                                <p><span className="font-semibold">Tracking Updated:</span> {order.trackingUpdatedAt ? new Date(order.trackingUpdatedAt).toLocaleString() : 'Not updated yet'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            {order.trackingNumber && (
                              <span className="text-sm text-gray-600">
                                Current tracking: <span className="font-medium">{order.trackingNumber}</span>
                                {order.trackingCarrier ? ` via ${order.trackingCarrier}` : ''}
                              </span>
                            )}
                            {buildAdminTrackingUrl(order) && (
                              <a
                                href={buildAdminTrackingUrl(order)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              >
                                Open tracking link
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageDeliveries;
