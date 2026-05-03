import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Eye, Clock, Truck, CheckCircle, XCircle, Filter, RefreshCw } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((o) => o.orderStatus === statusFilter));
    }
  }, [orders, statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data.orders);
      setFilteredOrders(response.data.orders);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(`/api/orders/${orderId}/status`, { orderStatus: newStatus });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
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

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'processing':
        return { status: 'shipped', label: 'Mark as Shipped' };
      case 'shipped':
        return { status: 'delivered', label: 'Mark as Delivered' };
      default:
        return null;
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
        title="Manage Orders"
        subtitle="Track active pharmacy orders, update shipment progress, and keep customer fulfilment moving without leaving the pharmacist workspace."
        eyebrow="PharmaCare Pharmacist"
        icon={Package}
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchOrders}
              className="btn-secondary flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>

            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-44"
            >
              <option value="all">All Orders</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No orders found</h3>
          <p className="text-gray-600">
            {statusFilter === 'all'
              ? 'No orders have been placed yet.'
              : `No ${statusFilter} orders found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.orderStatus);

            return (
              <div key={order._id} className="card">
                <div className="flex flex-col justify-between lg:flex-row lg:items-center">
                  <div className="flex items-start space-x-4">
                    <div className={`rounded-lg p-3 ${getStatusColor(order.orderStatus)}`}>
                      {getStatusIcon(order.orderStatus)}
                    </div>
                    <div>
                      <div className="mb-1 flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs capitalize ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Customer:</span> {order.user?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items?.length} items - {formatCurrency(order.finalAmount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      {order.shippedAt && (
                        <p className="text-sm text-blue-600">
                          Shipped on {new Date(order.shippedAt).toLocaleDateString()}
                        </p>
                      )}
                      {order.deliveredAt && (
                        <p className="text-sm text-green-600">
                          Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2 lg:mt-0">
                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>

                    {nextStatus && (
                      <button
                        onClick={() => updateOrderStatus(order._id, nextStatus.status)}
                        disabled={updating === order._id}
                        className="btn-primary"
                      >
                        {updating === order._id ? 'Updating...' : nextStatus.label}
                      </button>
                    )}

                    {order.orderStatus === 'processing' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        disabled={updating === order._id}
                        className="btn-danger"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Delivery Address: </span>
                    <span className="text-gray-600">
                      {order.deliveryAddress?.street}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium text-gray-700">Contact: </span>
                    <span className="text-gray-600">{order.contactNumber}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.items?.slice(0, 4).map((item, index) => (
                    <span key={index} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      {item.medicine?.name} x {item.quantity}
                    </span>
                  ))}
                  {order.items?.length > 4 && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      +{order.items.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
