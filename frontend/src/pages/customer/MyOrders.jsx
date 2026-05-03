import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Eye, Clock, Truck, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import { downloadOrderInvoice, formatOrderCurrency } from '../../utils/orderInvoice';

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders/my-orders');
      setOrders(response.data.orders);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await axios.put(`/api/orders/${orderId}/cancel`);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingStatusText = (order) => {
    if (order.orderStatus === 'delivered') {
      return 'Delivered to customer';
    }

    if (order.orderStatus === 'shipped') {
      return 'In transit';
    }

    if (order.paymentStatus === 'paid' && order.trackingNumber) {
      return 'Tracking created';
    }

    if (order.trackingNumber) {
      return 'Tracking created';
    }

    return 'Tracking is being prepared';
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
        title="My Orders"
        subtitle="Track delivery progress, payment status, order contents, and shipment history from your complete customer order center."
        eyebrow="PharmaCare Customer"
        icon={Package}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">
            Your order history will appear here once you make a purchase
          </p>
          <Link to="/medicines" className="btn-primary">
            Browse Medicines
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getStatusColor(order.orderStatus)}`}>
                    {getStatusIcon(order.orderStatus)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                        Payment: {order.paymentStatus}
                      </span>
                      <span className="text-sm text-gray-500">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <Link
                    to={`/customer/orders/${order._id}`}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => downloadOrderInvoice(order, user)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Invoice</span>
                  </button>

                  {order.orderStatus === 'processing' && (
                    <button onClick={() => cancelOrder(order._id)} className="btn-danger">
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-4 mb-4">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {item.medicine?.name || 'Unknown'} x {item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="flex items-center bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm text-gray-600">+{order.items.length - 3} more</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Delivery Address:</span>
                    <br />
                    {order.deliveryAddress?.street}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-medical-600">{formatOrderCurrency(order.finalAmount)}</p>
                  </div>
                </div>
              </div>

              {(order.trackingNumber || order.paymentStatus === 'paid') && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Tracking Status</p>
                      <p className="text-sm text-blue-800">{getTrackingStatusText(order)}</p>
                    </div>
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">Tracking No:</span>{' '}
                      {order.trackingNumber || 'Will be created automatically after order placement'}
                    </div>
                  </div>
                </div>
              )}

              {order.orderStatus === 'shipped' && order.shippedAt && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Shipped on:</span> {new Date(order.shippedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {order.orderStatus === 'delivered' && order.deliveredAt && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Delivered on:</span> {new Date(order.deliveredAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
