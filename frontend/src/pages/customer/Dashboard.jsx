import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Upload,
  FileText,
  ShoppingCart,
  Package,
  Clock,
  Download,
  Pill,
  Filter,
  Star,
  MessageSquare
} from 'lucide-react';
import { downloadOrderInvoice, formatOrderCurrency } from '../../utils/orderInvoice';

const HEALTHCARE_HERO_IMAGE = '/uploads/medicine-1774623193210-895796864.jpg';
const dashboardStatCards = [
  { key: 'prescriptions', label: 'Prescriptions', icon: FileText, accent: 'from-sky-500 to-cyan-500' },
  { key: 'pendingPrescriptions', label: 'Pending Review', icon: Clock, accent: 'from-amber-500 to-orange-500' },
  { key: 'orders', label: 'Orders', icon: Package, accent: 'from-teal-500 to-emerald-500' },
  { key: 'cartItems', label: 'Cart Items', icon: ShoppingCart, accent: 'from-fuchsia-500 to-violet-500' }
];

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({
    prescriptions: 0,
    pendingPrescriptions: 0,
    orders: 0,
    cartItems: 0
  });
  const [recentOrders, setRecentOrders] = React.useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = React.useState([]);
  const [allOrders, setAllOrders] = React.useState([]);
  const [loadingOrders, setLoadingOrders] = React.useState(true);
  const [ordersError, setOrdersError] = React.useState('');
  const [reviews, setReviews] = React.useState([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(true);
  const [reviewMessage, setReviewMessage] = React.useState('');
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [historyFilters, setHistoryFilters] = React.useState({
    search: '',
    category: 'all',
    status: 'all'
  });
  const [medicineReviewForm, setMedicineReviewForm] = React.useState({
    orderId: '',
    medicineId: '',
    rating: '5',
    comment: ''
  });
  const [serviceReviewForm, setServiceReviewForm] = React.useState({
    orderId: '',
    rating: '5',
    comment: ''
  });

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, reviewsRes, prescriptionsRes, cartRes] = await Promise.all([
          axios.get('/api/orders/my-orders'),
          axios.get('/api/reviews/my-reviews'),
          axios.get('/api/prescriptions/my-prescriptions'),
          axios.get('/api/cart')
        ]);
        const orders = ordersRes.data.orders || [];
        const customerReviews = reviewsRes.data.reviews || [];
        const prescriptions = prescriptionsRes.data.prescriptions || [];
        const cart = cartRes.data.cart || { items: [] };
        const cartItems = (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const pendingPrescriptions = prescriptions.filter((item) => item.status === 'pending').length;

        setAllOrders(orders);
        setRecentOrders(orders.slice(0, 4));
        setRecentPrescriptions(prescriptions.slice(0, 3));
        setReviews(customerReviews);
        setStats({
          prescriptions: prescriptions.length,
          pendingPrescriptions,
          orders: orders.length,
          cartItems
        });
      } catch (err) {
        setOrdersError('Failed to load recent orders');
      } finally {
        setLoadingOrders(false);
        setReviewsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jotfor.ms/agent/embedjs/019dcf74f0a27e1091c9eff5da76c4466df8/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const medicationHistory = React.useMemo(() => (
    allOrders.flatMap((order) =>
      (order.items || []).map((item, index) => ({
        id: `${order._id}-${item.medicine?._id || index}`,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        purchasedAt: order.createdAt,
        quantity: item.quantity,
        total: item.total,
        medicineName: item.medicine?.name || 'Unknown medicine',
        category: item.medicine?.category || 'Uncategorized'
      }))
    )
  ), [allOrders]);

  const categoryOptions = React.useMemo(() => (
    [...new Set(medicationHistory.map((item) => item.category).filter(Boolean))].sort((left, right) => left.localeCompare(right))
  ), [medicationHistory]);

  const filteredMedicationHistory = React.useMemo(() => {
    const searchTerm = historyFilters.search.trim().toLowerCase();

    return medicationHistory.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.medicineName.toLowerCase().includes(searchTerm) ||
        item.orderNumber.toLowerCase().includes(searchTerm);
      const matchesCategory =
        historyFilters.category === 'all' || item.category === historyFilters.category;
      const matchesStatus =
        historyFilters.status === 'all' || item.orderStatus === historyFilters.status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [historyFilters, medicationHistory]);

  const handleHistoryFilterChange = (event) => {
    const { name, value } = event.target;
    setHistoryFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const rateableMedicineOptions = React.useMemo(() => (
    allOrders.flatMap((order) =>
      (order.items || []).map((item) => ({
        key: `${order._id}-${item.medicine?._id}`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        medicineId: item.medicine?._id,
        medicineName: item.medicine?.name || 'Unknown medicine',
        category: item.medicine?.category || 'Uncategorized'
      }))
    ).filter((item) => item.medicineId)
  ), [allOrders]);

  const selectedMedicineOption = rateableMedicineOptions.find((item) => (
    item.orderId === medicineReviewForm.orderId && item.medicineId === medicineReviewForm.medicineId
  ));

  const serviceReviewOrders = React.useMemo(() => (
    allOrders.filter((order) => !['cancelled', 'rejected'].includes(order.orderStatus))
  ), [allOrders]);

  const handleMedicineReviewChange = (event) => {
    const { name, value } = event.target;
    if (name === 'selection') {
      const selectedOption = rateableMedicineOptions.find((item) => item.key === value);
      setMedicineReviewForm((prev) => ({
        ...prev,
        orderId: selectedOption?.orderId || '',
        medicineId: selectedOption?.medicineId || ''
      }));
      return;
    }

    setMedicineReviewForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceReviewChange = (event) => {
    const { name, value } = event.target;
    setServiceReviewForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const submitReview = async (reviewType) => {
    setSubmittingReview(true);
    setOrdersError('');
    setReviewMessage('');

    try {
      const payload = reviewType === 'medicine'
        ? {
            orderId: medicineReviewForm.orderId,
            medicineId: medicineReviewForm.medicineId,
            reviewType: 'medicine',
            rating: Number(medicineReviewForm.rating),
            comment: medicineReviewForm.comment
          }
        : {
            orderId: serviceReviewForm.orderId,
            reviewType: 'service',
            rating: Number(serviceReviewForm.rating),
            comment: serviceReviewForm.comment
          };

      const response = await axios.post('/api/reviews', payload);
      const nextReview = response.data.review;

      setReviews((prev) => {
        const withoutSame = prev.filter((review) => review._id !== nextReview._id);
        return [nextReview, ...withoutSame];
      });

      if (reviewType === 'medicine') {
        setMedicineReviewForm({
          orderId: '',
          medicineId: '',
          rating: '5',
          comment: ''
        });
        setReviewMessage('Medicine rating saved successfully');
      } else {
        setServiceReviewForm({
          orderId: '',
          rating: '5',
          comment: ''
        });
        setReviewMessage('Service rating saved successfully');
      }
    } catch (err) {
      setOrdersError(err.response?.data?.message || 'Failed to save review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const quickActions = [
    {
      title: 'Upload Prescription',
      description: 'Upload a new prescription for pharmacist review.',
      icon: Upload,
      path: '/customer/upload-prescription',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'View Cart',
      description: 'Review medicines in your cart before checkout.',
      icon: ShoppingCart,
      path: '/customer/cart',
      color: 'bg-medical-50 text-medical-600'
    },
    {
      title: 'My Orders',
      description: 'Track your order progress and delivery status.',
      icon: Package,
      path: '/customer/orders',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Prescriptions',
      description: 'View all uploaded prescriptions and notes.',
      icon: FileText,
      path: '/customer/prescriptions',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div>
      <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${HEALTHCARE_HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,47,73,0.92)_0%,rgba(15,118,110,0.82)_42%,rgba(226,232,240,0.18)_100%)]" />
        <div className="absolute -left-12 top-10 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                PharmaCare Customer Dashboard
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Healthcare at a glance for {user?.name || 'Customer'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                Track prescriptions, manage medicine orders, monitor your cart, and stay connected to delivery and support from one modern patient dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/customer/upload-prescription" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-50">
                  Upload Prescription
                </Link>
                <Link to="/customer/orders" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                  View Orders
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {dashboardStatCards.map((item) => (
                <div key={item.key} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200/80">{item.label}</p>
                      <p className="mt-3 text-3xl font-black text-white">{stats[item.key]}</p>
                    </div>
                    <div className={`rounded-2xl bg-gradient-to-br ${item.accent} p-3 text-white shadow-lg`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-gray-600">Jump straight into the next healthcare task you need to handle.</p>
          </div>
          <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Patient Workspace
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.path}
              className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.14)]"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-slate-100/70 blur-2xl transition group-hover:bg-cyan-100/80" />
              <div className={`${action.color} relative p-3 rounded-2xl w-fit mb-4`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="relative font-semibold text-gray-900 mb-1 group-hover:text-medical-600">
                {action.title}
              </h3>
              <p className="relative text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Prescriptions</h3>
          <div className="space-y-4">
            {recentPrescriptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No prescriptions yet. Upload one to start your review flow.
              </div>
            ) : recentPrescriptions.map((prescription) => (
              <div key={prescription._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Prescription #{prescription._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">Submitted on {new Date(prescription.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  prescription.status === 'completed' ? 'bg-green-100 text-green-800' :
                  prescription.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {prescription.status}
                </span>
              </div>
            ))}
          </div>
          <Link to="/customer/prescriptions" className="text-medical-600 text-sm font-medium mt-4 inline-block hover:underline">
            View all prescriptions
          </Link>
        </div>

        <div className="card border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Order History & Invoice</h3>
              <p className="mt-1 text-sm text-gray-600">
                View your past orders and download invoices anytime.
              </p>
            </div>
            <Link to="/customer/orders" className="text-medical-600 text-sm font-medium hover:underline">
              View all orders
            </Link>
          </div>

          {loadingOrders ? (
            <div className="py-8 text-sm text-gray-500">Loading recent orders...</div>
          ) : ordersError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ordersError}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              No orders yet. Your order history will appear here after checkout.
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-medical-100 p-2 rounded">
                        <Package className="h-4 w-4 text-medical-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()} - {order.items.length} item{order.items.length !== 1 ? 's' : ''} - {formatOrderCurrency(order.finalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                        {order.orderStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadOrderInvoice(order, user)}
                        className="inline-flex items-center gap-2 rounded-lg border border-medical-200 bg-white px-3 py-2 text-sm font-medium text-medical-700 transition hover:bg-medical-50"
                      >
                        <Download className="h-4 w-4" />
                        Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="card">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-medical-600" />
                <h3 className="text-lg font-bold text-gray-900">Medication History Tracking</h3>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                View your medicine purchase history and apply filters to quickly find past medicines.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
              <Filter className="h-4 w-4" />
              Customer view medicine history with filters
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Search Medicine</label>
              <input
                type="text"
                name="search"
                value={historyFilters.search}
                onChange={handleHistoryFilterChange}
                placeholder="Medicine name or order number"
                className="input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={historyFilters.category}
                onChange={handleHistoryFilterChange}
                className="input"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Order Status</label>
              <select
                name="status"
                value={historyFilters.status}
                onChange={handleHistoryFilterChange}
                className="input"
              >
                <option value="all">All Statuses</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loadingOrders ? (
            <div className="py-8 text-sm text-gray-500">Loading medication history...</div>
          ) : ordersError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {ordersError}
            </div>
          ) : filteredMedicationHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              No medication history matches your current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Medicine</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredMedicationHistory.slice(0, 8).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.medicineName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">#{item.orderNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(item.purchasedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatOrderCurrency(item.total)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                          {item.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="card">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">Reviews & Ratings</h3>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Rate medicines and your PharmaCare service experience from your customer dashboard.
              </p>
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Customer can rate medicines and service
            </div>
          </div>

          {reviewMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {reviewMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Pill className="h-4 w-4 text-medical-600" />
                <h4 className="font-semibold text-gray-900">Rate Medicine</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Select Medicine</label>
                  <select
                    name="selection"
                    value={selectedMedicineOption ? selectedMedicineOption.key : ''}
                    onChange={handleMedicineReviewChange}
                    className="input"
                  >
                    <option value="">Choose purchased medicine</option>
                    {rateableMedicineOptions.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.medicineName} - Order #{item.orderNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Rating</label>
                  <select
                    name="rating"
                    value={medicineReviewForm.rating}
                    onChange={handleMedicineReviewChange}
                    className="input"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={String(rating)}>
                        {'★'.repeat(rating)} ({rating})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    name="comment"
                    value={medicineReviewForm.comment}
                    onChange={handleMedicineReviewChange}
                    className="input min-h-[110px]"
                    placeholder="Share your medicine experience"
                  />
                </div>

                <button
                  type="button"
                  disabled={submittingReview || !medicineReviewForm.orderId || !medicineReviewForm.medicineId}
                  onClick={() => submitReview('medicine')}
                  className="btn-primary"
                >
                  {submittingReview ? 'Saving...' : 'Submit Medicine Rating'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Rate Service</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Select Order</label>
                  <select
                    name="orderId"
                    value={serviceReviewForm.orderId}
                    onChange={handleServiceReviewChange}
                    className="input"
                  >
                    <option value="">Choose order</option>
                    {serviceReviewOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        Order #{order.orderNumber} - {new Date(order.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Rating</label>
                  <select
                    name="rating"
                    value={serviceReviewForm.rating}
                    onChange={handleServiceReviewChange}
                    className="input"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={String(rating)}>
                        {'★'.repeat(rating)} ({rating})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    name="comment"
                    value={serviceReviewForm.comment}
                    onChange={handleServiceReviewChange}
                    className="input min-h-[110px]"
                    placeholder="Tell us about delivery, service, or support"
                  />
                </div>

                <button
                  type="button"
                  disabled={submittingReview || !serviceReviewForm.orderId}
                  onClick={() => submitReview('service')}
                  className="btn-secondary"
                >
                  {submittingReview ? 'Saving...' : 'Submit Service Rating'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Recent Ratings</h4>
            {reviewsLoading ? (
              <div className="text-sm text-gray-500">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                No ratings yet. Submit your first medicine or service review above.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 6).map((review) => (
                  <div key={review._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {review.reviewType === 'medicine' ? review.medicine?.name || 'Medicine review' : `Service review - Order #${review.order?.orderNumber || ''}`}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                            {review.reviewType}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {review.order?.orderNumber ? `Order #${review.order.orderNumber} - ` : ''}{new Date(review.createdAt).toLocaleDateString()}
                        </p>
                        {review.comment && (
                          <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-amber-600">
                        {'★'.repeat(Number(review.rating || 0))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
