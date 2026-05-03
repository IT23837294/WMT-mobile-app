import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Users, Package } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const Analytics = () => {
  const [stats, setStats] = useState({
    overall: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
    byStatus: [],
    byPayment: [],
    monthlySales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/orders/stats/overview');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  const monthlyData = stats.monthlySales?.map(item => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    sales: item.sales,
    orders: item.orders
  }))?.reverse() || [];

  return (
    <div>
      <AdminPageHeader
        title="Analytics Dashboard"
        subtitle="Review order growth, revenue movement, payment behavior, and operational performance through clearer business reporting."
        icon={TrendingUp}
        stats={[
          { label: 'Total Orders', value: stats.overall.totalOrders },
          { label: 'Revenue', value: formatCurrency(stats.overall.totalRevenue) },
          { label: 'Avg Order', value: formatCurrency(stats.overall.avgOrderValue) },
          { label: 'Statuses', value: stats.byStatus.reduce((acc, item) => acc + item.count, 0) }
        ]}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overall.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.overall.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.overall.avgOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Order Status</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.byStatus.reduce((acc, item) => acc + item.count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Sales Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Sales</h3>
          <div className="h-80">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="sales" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No sales data available
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status Distribution</h3>
          <div className="h-80">
            {stats.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="_id"
                  >
                    {stats.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No order status data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Orders Trend */}
      <div className="card mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Orders Trend</h3>
        <div className="h-80">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No orders data available
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.byStatus.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                {item.count}
              </p>
              <p className="text-sm text-gray-600 capitalize">{item._id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
