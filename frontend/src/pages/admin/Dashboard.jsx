import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Pill, 
  Truck, 
  FileText, 
  Package, 
  TrendingUp,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;
const adminMetricCards = [
  { key: 'totalUsers', label: 'Users', icon: Users, accent: 'from-sky-500 to-blue-600' },
  { key: 'totalMedicines', label: 'Medicines', icon: Pill, accent: 'from-teal-500 to-emerald-600' },
  { key: 'totalOrders', label: 'Orders', icon: Package, accent: 'from-violet-500 to-purple-600' },
  { key: 'totalRevenue', label: 'Revenue', icon: DollarSign, accent: 'from-emerald-500 to-lime-500', formatter: formatCurrency }
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMedicines: 0,
    totalSuppliers: 0,
    totalPrescriptions: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    pendingPrescriptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch data from various endpoints
      const [usersRes, medicinesRes, suppliersRes, prescriptionsRes, ordersRes, alertsRes] = await Promise.all([
        axios.get('/api/auth/users').catch(() => ({ data: { users: [] } })),
        axios.get('/api/medicines').catch(() => ({ data: { medicines: [] } })),
        axios.get('/api/suppliers').catch(() => ({ data: { suppliers: [] } })),
        axios.get('/api/prescriptions').catch(() => ({ data: { prescriptions: [] } })),
        axios.get('/api/orders').catch(() => ({ data: { orders: [] } })),
        axios.get('/api/medicines/alerts').catch(() => ({ data: { alerts: { lowStock: [] } } }))
      ]);

      const orders = ordersRes.data.orders || [];
      const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
      const pendingPrescriptions = prescriptionsRes.data.prescriptions?.filter(p => p.status === 'pending').length || 0;

      setStats({
        totalUsers: usersRes.data.users?.length || 0,
        totalMedicines: medicinesRes.data.medicines?.length || 0,
        totalSuppliers: suppliersRes.data.suppliers?.length || 0,
        totalPrescriptions: prescriptionsRes.data.prescriptions?.length || 0,
        totalOrders: orders.length,
        totalRevenue,
        lowStockCount: alertsRes.data.alerts?.lowStock?.length || 0,
        pendingPrescriptions
      });
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
      <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.20)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),linear-gradient(125deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.88)_45%,rgba(15,118,110,0.72)_100%)]" />
        <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                PharmaCare Admin Command Center
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Run operations, inventory, and revenue from one admin dashboard
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100/85 sm:text-base">
                Keep watch on customers, medicines, supplier activity, order volume, and business pressure points with a sharper operational overview.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/admin/analytics" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-50">
                  Open Analytics
                </Link>
                <Link to="/admin/alerts" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                  Review Alerts
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {adminMetricCards.map((card) => (
                <div key={card.key} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200/80">{card.label}</p>
                      <p className="mt-3 text-3xl font-black text-white">
                        {card.formatter ? card.formatter(stats[card.key]) : stats[card.key]}
                      </p>
                    </div>
                    <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-lg`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Operational Priorities</h2>
              <p className="mt-1 text-sm text-slate-600">Focus on the areas that need fast admin attention today.</p>
            </div>
            <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Live Overview
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/pharmacist/prescriptions" className="rounded-2xl border border-amber-100 bg-amber-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-amber-100 p-3">
                  <FileText className="h-6 w-6 text-amber-700" />
                </div>
                <span className="text-3xl font-black text-amber-700">{stats.pendingPrescriptions}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Pending Prescriptions</h3>
              <p className="mt-1 text-sm text-slate-600">Send pharmacists where review demand is building up.</p>
            </Link>

            <Link to="/admin/alerts" className="rounded-2xl border border-rose-100 bg-rose-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-rose-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-rose-700" />
                </div>
                <span className="text-3xl font-black text-rose-700">{stats.lowStockCount}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Low Stock Alerts</h3>
              <p className="mt-1 text-sm text-slate-600">Critical inventory items that may disrupt customer fulfillment.</p>
            </Link>

            <Link to="/admin/suppliers" className="rounded-2xl border border-violet-100 bg-violet-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-violet-100 p-3">
                  <Truck className="h-6 w-6 text-violet-700" />
                </div>
                <span className="text-3xl font-black text-violet-700">{stats.totalSuppliers}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Supplier Network</h3>
              <p className="mt-1 text-sm text-slate-600">Monitor supplier capacity and support replenishment planning.</p>
            </Link>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-black tracking-tight text-slate-900">System Snapshot</h2>
          <p className="mt-1 text-sm text-slate-600">A compact view of overall platform health and business movement.</p>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Revenue Pulse</div>
              <div className="mt-2 text-3xl font-black text-emerald-600">{formatCurrency(stats.totalRevenue)}</div>
              <div className="mt-2 text-sm text-slate-600">Total gross order value currently tracked by the platform.</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Users</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{stats.totalUsers}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orders</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{stats.totalOrders}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Medicines</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{stats.totalMedicines}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prescriptions</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{stats.totalPrescriptions}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-600">Move directly into the admin tasks that keep operations flowing.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Action Panel
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link to="/admin/suppliers/new" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="rounded-2xl bg-violet-50 p-3 w-fit">
              <Truck className="h-6 w-6 text-violet-700" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-violet-700">Register Supplier</h3>
            <p className="mt-1 text-sm text-slate-600">Bring a new supplier into the network and map their catalog.</p>
          </Link>

          <Link to="/admin/analytics" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="rounded-2xl bg-sky-50 p-3 w-fit">
              <TrendingUp className="h-6 w-6 text-sky-700" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-sky-700">Open Analytics</h3>
            <p className="mt-1 text-sm text-slate-600">Review trends, monthly growth, and performance breakdowns.</p>
          </Link>

          <Link to="/admin/users" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="rounded-2xl bg-blue-50 p-3 w-fit">
              <Users className="h-6 w-6 text-blue-700" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-700">Manage Users</h3>
            <p className="mt-1 text-sm text-slate-600">Control accounts, review roles, and maintain access hygiene.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
