import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, ArrowLeft, Clock, Truck, CheckCircle, XCircle, MapPin, CreditCard, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { downloadOrderInvoice, formatOrderCurrency } from '../../utils/orderInvoice';
const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  card: 'Card Payment',
  online: 'Online Payment',
  bank_deposit: 'Bank Deposit'
};

const OrderDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`/api/orders/${id}`);
      setOrder(response.data.order);
    } catch (err) {
      setError('Failed to load order details');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'shipped':
        return <Truck className="h-6 w-6 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Package className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getTrackingStatusText = () => {
    if (order.orderStatus === 'delivered') {
      return 'Delivered successfully';
    }

    if (order.orderStatus === 'shipped') {
      return 'Your package is currently in transit';
    }

    if (order.paymentStatus === 'paid' && order.trackingNumber) {
      return 'Tracking has been created and your order is being prepared';
    }

    if (order.trackingNumber) {
      return 'Tracking has been created and your order is being prepared';
    }

    return 'Tracking will be created automatically after your order is placed';
  };

  const getTrackingDeliveryDate = () => {
    if (order.orderStatus === 'rejected') {
      return {
        label: 'Delivery Update',
        value: 'Delivery was rejected'
      };
    }

    if (order.orderStatus === 'cancelled') {
      return {
        label: 'Delivery Update',
        value: 'Order was cancelled before delivery'
      };
    }

    if (order.deliveredAt) {
      return {
        label: 'Delivered On',
        value: new Date(order.deliveredAt).toLocaleDateString()
      };
    }

    const baseDate = order.shippedAt || order.createdAt;
    if (!baseDate) {
      return {
        label: 'Estimated Delivery',
        value: 'Not available yet'
      };
    }

    const estimatedDate = new Date(baseDate);
    estimatedDate.setDate(estimatedDate.getDate() + (order.orderStatus === 'shipped' ? 2 : 4));

    return {
      label: 'Estimated Delivery',
      value: estimatedDate.toLocaleDateString()
    };
  };

  const getTrackingSteps = () => {
    const cancelled = order.orderStatus === 'cancelled';
    const rejected = order.orderStatus === 'rejected';

    return [
      {
        key: 'placed',
        label: 'Order Placed',
        detail: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Order received',
        active: true,
        complete: true,
        tone: 'green'
      },
      {
        key: 'tracking',
        label: 'Tracking Created',
        detail: order.trackingNumber || 'Tracking number pending',
        active: Boolean(order.trackingNumber),
        complete: Boolean(order.trackingNumber),
        tone: 'blue'
      },
      {
        key: 'processing',
        label: 'Preparing Order',
        detail: order.paymentStatus === 'paid' ? 'Payment confirmed and order is being prepared' : 'Waiting for payment confirmation',
        active: order.paymentStatus === 'paid' || ['processing', 'shipped', 'delivered'].includes(order.orderStatus),
        complete: ['processing', 'shipped', 'delivered'].includes(order.orderStatus),
        tone: 'amber'
      },
      {
        key: 'shipped',
        label: 'Shipped',
        detail: order.shippedAt ? new Date(order.shippedAt).toLocaleString() : 'Not shipped yet',
        active: ['shipped', 'delivered'].includes(order.orderStatus),
        complete: ['shipped', 'delivered'].includes(order.orderStatus),
        tone: 'blue'
      },
      {
        key: 'delivered',
        label: cancelled ? 'Cancelled' : rejected ? 'Rejected' : 'Delivered',
        detail: cancelled
          ? 'Order cancelled before delivery'
          : rejected
            ? 'Delivery was rejected'
            : order.deliveredAt
              ? new Date(order.deliveredAt).toLocaleString()
              : trackingDeliveryDate.value,
        active: ['delivered', 'cancelled', 'rejected'].includes(order.orderStatus),
        complete: order.orderStatus === 'delivered',
        tone: cancelled || rejected ? 'red' : 'green'
      }
    ];
  };

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await axios.put(`/api/orders/${id}/cancel`);
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Order not found</p>
        <button onClick={() => navigate('/customer/orders')} className="btn-primary mt-4">
          Back to Orders
        </button>
      </div>
    );
  }

  const trackingDeliveryDate = getTrackingDeliveryDate();
  const trackingOrderPlacedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString()
    : 'Not available';
  const trackingSteps = getTrackingSteps();

  const getStepClasses = (step) => {
    if (step.tone === 'red') {
      return step.active ? 'bg-red-500 border-red-500 text-red-700' : 'bg-red-100 border-red-200 text-red-500';
    }

    if (step.tone === 'amber') {
      return step.active ? 'bg-amber-500 border-amber-500 text-amber-700' : 'bg-amber-100 border-amber-200 text-amber-500';
    }

    if (step.tone === 'blue') {
      return step.active ? 'bg-blue-500 border-blue-500 text-blue-700' : 'bg-blue-100 border-blue-200 text-blue-500';
    }

    return step.active ? 'bg-green-500 border-green-500 text-green-700' : 'bg-green-100 border-green-200 text-green-500';
  };

  return (
    <div>
      <button
        onClick={() => navigate('/customer/orders')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Orders
      </button>

      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-600 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadOrderInvoice(order, user)}
            className="inline-flex items-center gap-2 rounded-lg border border-medical-200 bg-white px-4 py-2.5 text-sm font-medium text-medical-700 transition hover:bg-medical-50"
          >
            <Download className="h-4 w-4" />
            Download Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Order Status */}
      <div className={`card mb-6 border-l-4 ${getStatusColor(order.orderStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(order.orderStatus)}
            <div>
              <h3 className="font-semibold capitalize">{order.orderStatus}</h3>
              <p className="text-sm">
                {order.orderStatus === 'processing' && 'Your order is being prepared'}
                {order.orderStatus === 'shipped' && 'Your order is on the way'}
                {order.orderStatus === 'delivered' && 'Your order has been delivered'}
                {order.orderStatus === 'cancelled' && 'This order has been cancelled'}
              </p>
            </div>
          </div>
          {order.orderStatus === 'processing' && (
            <button onClick={cancelOrder} className="btn-danger">
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 w-16 h-16 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.medicine?.name}</h4>
                      <p className="text-sm text-gray-600">{item.medicine?.category}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatOrderCurrency(item.total)}</p>
                    <p className="text-sm text-gray-500">{formatOrderCurrency(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Delivery Address
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{order.deliveryAddress?.street}</p>
              <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}</p>
              <p>{order.deliveryAddress?.country}</p>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Contact:</span> {order.contactNumber}
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Tracking Details
            </h3>
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900 mb-3">Tracking View</p>
              <div className="space-y-4">
                {trackingSteps.map((step, index) => (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-4 w-4 rounded-full border-4 ${getStepClasses(step).split(' ').slice(0, 2).join(' ')}`}></div>
                      {index !== trackingSteps.length - 1 && (
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
            <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div>
                <p className="text-sm font-medium text-blue-900">Tracking Status</p>
                <p className="text-sm text-blue-800">{getTrackingStatusText()}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm text-blue-900">
                <div>
                  <span className="font-medium">Order Number:</span>{' '}
                  {order.orderNumber || 'Generating order number'}
                </div>
                <div>
                  <span className="font-medium">Order Placed:</span>{' '}
                  {trackingOrderPlacedDate}
                </div>
                <div>
                  <span className="font-medium">Courier:</span>{' '}
                  {order.trackingCarrier || 'PharmaCare Courier'}
                </div>
                <div>
                  <span className="font-medium">{trackingDeliveryDate.label}:</span>{' '}
                  {trackingDeliveryDate.value}
                </div>
                <div>
                  <span className="font-medium">Tracking Number:</span>{' '}
                  {order.trackingNumber || 'Waiting for automatic tracking creation'}
                </div>
                <div>
                  <span className="font-medium">Tracking Updated:</span>{' '}
                  {order.trackingUpdatedAt ? new Date(order.trackingUpdatedAt).toLocaleString() : 'Not updated yet'}
                </div>
                <div>
                  <span className="font-medium">Delivery Stage:</span>{' '}
                  <span className="capitalize">{order.orderStatus}</span>
                </div>
              </div>
              {order.trackingUrl && order.paymentStatus === 'paid' && order.trackingUrl !== `/customer/orders/${order._id}` && (
                <a
                  href={order.trackingUrl}
                  className="inline-flex text-sm font-medium text-medical-700 hover:underline"
                >
                  Open tracking view
                </a>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Order Notes</h3>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Order Summary
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatOrderCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charge</span>
                <span className="font-medium">{formatOrderCurrency(order.deliveryCharge)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">- {formatOrderCurrency(order.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-medical-600">{formatOrderCurrency(order.finalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="text-sm font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
              </div>
              {order.cardSummary?.last4 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Card</span>
                  <span className="text-sm font-medium">**** **** **** {order.cardSummary.last4}</span>
                </div>
              )}
              {order.paymentReference && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Reference</span>
                  <span className="text-sm font-medium">{order.paymentReference}</span>
                </div>
              )}
              {order.depositReceipt && (
                <div className="mb-2">
                  <a
                    href={order.depositReceipt}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-medical-600 hover:underline"
                  >
                    View Bank Deposit Receipt
                  </a>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Status</span>
                <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
