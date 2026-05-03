import React from 'react';
import { AlertTriangle, Factory } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import Performance from './Performance';
import useSupplierDashboardData from './useSupplierDashboardData';

const SupplierPerformancePage = () => {
  const { user } = useAuth();
  const { loading, error, orderStats, monthlyStatements, supplier, performance } = useSupplierDashboardData();

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
          title="Performance"
          subtitle="Supplier ratings, trends, and financial statements."
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
        title="Performance"
        subtitle="Ratings, statement history, and top products."
        eyebrow="Supplier Portal"
        icon={Factory}
        stats={[
          { label: 'Rating', value: `${Number(performance.rating || 0).toFixed(1)} / 5` },
          { label: 'On-time delivery', value: `${Number(performance.onTimeDeliveryRate || 0).toFixed(0)}%` },
          { label: 'Statements', value: monthlyStatements.length }
        ]}
      />

      <Performance orderStats={orderStats} monthlyStatements={monthlyStatements} supplier={supplier} />
    </div>
  );
};

export default SupplierPerformancePage;
