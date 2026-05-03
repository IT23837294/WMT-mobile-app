import React from 'react';
import { AlertTriangle, Factory } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import Catalog from './Catalog';
import useSupplierDashboardData from './useSupplierDashboardData';

const SupplierCatalogPage = () => {
  const { user } = useAuth();
  const { supplier, loading, error, supplierData } = useSupplierDashboardData();

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
          title="Catalog"
          subtitle="Products currently linked to this supplier."
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
        title="Catalog"
        subtitle="Products and price points currently associated with your supplier record."
        eyebrow="Supplier Portal"
        icon={Factory}
        stats={[
          { label: 'Catalog items', value: supplierData?.stats?.catalogItems ?? 0 },
          { label: 'Active medicines', value: supplierData?.stats?.activeMedicines ?? 0 },
          { label: 'Supplier', value: supplier?.companyName || 'Not set' }
        ]}
      />

      <Catalog supplier={supplier} />
    </div>
  );
};

export default SupplierCatalogPage;
