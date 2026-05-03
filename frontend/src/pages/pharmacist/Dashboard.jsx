import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  Package,
  Pill,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const PharmacistDashboard = () => {
  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    reviewedToday: 5,
    processingOrders: 0,
    lowStockMedicines: 0,
    nearExpiryMedicines: 0
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [nearExpiryMedicines, setNearExpiryMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const prescriptionsRes = await axios.get('/api/prescriptions?status=pending');
      const ordersRes = await axios.get('/api/orders?orderStatus=processing');
      const alertsRes = await axios.get('/api/medicines/alerts');
      const alerts = alertsRes.data.alerts || {};

      setStats({
        pendingPrescriptions: prescriptionsRes.data.prescriptions?.length || 0,
        reviewedToday: 5,
        processingOrders: ordersRes.data.orders?.length || 0,
        lowStockMedicines: alerts.lowStock?.length || 0,
        nearExpiryMedicines: alerts.nearExpiry?.length || 0
      });

      setRecentPrescriptions(prescriptionsRes.data.prescriptions?.slice(0, 5) || []);
      setRecentOrders(ordersRes.data.orders?.slice(0, 5) || []);
      setNearExpiryMedicines(alerts.nearExpiry?.slice(0, 5) || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
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
        title="Pharmacist Dashboard"
        subtitle="Review prescriptions, manage pharmacy orders, and stay ahead of low-stock and near-expiry inventory from one professional workspace."
        eyebrow="PharmaCare Pharmacist"
        icon={FileText}
        stats={[
          { label: 'Pending Prescriptions', value: stats.pendingPrescriptions },
          { label: 'Reviewed Today', value: stats.reviewedToday },
          { label: 'Processing Orders', value: stats.processingOrders },
          { label: 'Low Stock Alerts', value: stats.lowStockMedicines }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingPrescriptions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Reviewed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.reviewedToday}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Processing Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processingOrders}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockMedicines}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Near Expiry Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.nearExpiryMedicines}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Link to="/pharmacist/prescriptions" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Review Prescriptions</h3>
              <p className="text-sm text-gray-600">Check and process pending prescriptions.</p>
            </div>
          </div>
        </Link>

        <Link to="/pharmacist/orders" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Orders</h3>
              <p className="text-sm text-gray-600">Update order status and coordinate fulfilment.</p>
            </div>
          </div>
        </Link>

        <Link to="/pharmacist/medicines" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-teal-50 p-3 rounded-lg">
              <Pill className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Medicine Management</h3>
              <p className="text-sm text-gray-600">Open the pharmacist medicine workspace adapted from the admin medicines page.</p>
            </div>
          </div>
        </Link>

        <Link to="/medicines?nearExpiry=true" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Near Expiry Medicines</h3>
              <p className="text-sm text-gray-600">Check medicines expiring within 30 days.</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Pending Prescriptions</h3>
            <Link to="/pharmacist/prescriptions" className="text-medical-600 text-sm hover:underline">
              View All
            </Link>
          </div>

          {recentPrescriptions.length === 0 ? (
            <p className="text-center py-8 text-gray-600">No pending prescriptions</p>
          ) : (
            <div className="space-y-4">
              {recentPrescriptions.map((prescription) => (
                <div key={prescription._id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center space-x-3">
                    <div className="rounded bg-yellow-100 p-2">
                      <FileText className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prescription.user?.name}</p>
                      <p className="text-xs text-gray-500">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link
                    to={`/pharmacist/prescriptions/${prescription._id}`}
                    className="text-medical-600 text-sm font-medium hover:underline"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
            <Link to="/pharmacist/orders" className="text-medical-600 text-sm hover:underline">
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-center py-8 text-gray-600">No processing orders</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center space-x-3">
                    <div className="rounded bg-blue-100 p-2">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">
                        {order.items?.length} items - {formatCurrency(order.finalAmount)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                    {order.orderStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Near Expiry Inventory</h3>
            <Link to="/medicines?nearExpiry=true" className="text-medical-600 text-sm hover:underline">
              View All
            </Link>
          </div>

          {nearExpiryMedicines.length === 0 ? (
            <p className="text-center py-8 text-gray-600">No near expiry medicines</p>
          ) : (
            <div className="space-y-4">
              {nearExpiryMedicines.map((medicine) => {
                const daysLeft = Math.ceil((new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={medicine._id} className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
                    <div className="flex items-center space-x-3">
                      <div className="rounded bg-orange-100 p-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{medicine.name}</p>
                        <p className="text-xs text-gray-500">
                          Expires on {new Date(medicine.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                      {daysLeft} days left
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
