import React from 'react';
import { AlertTriangle, Factory } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import Invoices from './Invoices';
import useSupplierDashboardData from './useSupplierDashboardData';

const SupplierInvoicesPage = () => {
  const { user } = useAuth();
  const { loading, error, invoices, supplierData } = useSupplierDashboardData();

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
          title="Invoices"
          subtitle="Invoice amounts, payment progress, and balances."
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
        title="Invoices"
        subtitle="A quick view of payment progress and outstanding balances."
        eyebrow="Supplier Portal"
        icon={Factory}
        stats={[
          { label: 'Invoices due', value: supplierData?.stats?.overdueInvoices ?? 0 },
          { label: 'Outstanding balance', value: `LKR ${Number(supplierData?.stats?.outstandingBalance || 0).toFixed(2)}` },
          { label: 'Paid invoices', value: supplierData?.stats?.paidInvoices ?? 0 }
        ]}
      />

      <Invoices invoices={invoices} />
    </div>
  );
};

export default SupplierInvoicesPage;
