import React from 'react';
import { AlertTriangle, Factory } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import Orders from './Orders';
import useSupplierDashboardData from './useSupplierDashboardData';

const SupplierOrdersPage = () => {
  const { user } = useAuth();
  const { loading, error, orders, orderStats, selectedOrder, setSelectedOrderId, supplierData } = useSupplierDashboardData();

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
          title="Orders"
          subtitle="Purchase orders and item-level detail."
          eyebrow="Supplier Portal"
          icon={Factory}
          stats={[{ label: 'Signed in as', value: user?.name || 'Supplier' }]}
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
        title="Orders"
        subtitle="Purchase order list and detailed order breakdown."
        eyebrow="Supplier Portal"
        icon={Factory}
        stats={[
          { label: 'Open orders', value: supplierData?.stats?.openOrders ?? 0 },
          { label: 'Order value', value: `LKR ${Number(orderStats.totalValue || 0).toFixed(2)}` },
          { label: 'Sent', value: orderStats.statusCounts.sent || 0 },
          { label: 'Completed', value: orderStats.statusCounts.completed || 0 }
        ]}
      />

      <Orders orders={orders} orderStats={orderStats} selectedOrder={selectedOrder} onSelectOrder={setSelectedOrderId} />
    </div>
  );
};

export default SupplierOrdersPage;
