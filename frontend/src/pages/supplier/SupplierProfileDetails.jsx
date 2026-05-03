import React from 'react';
import { Building2, CalendarDays, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { formatBoolean, formatCurrency, formatDate, getStatusClass } from './supplierDashboardUtils';

const SupplierProfileDetails = ({ supplier, user, stats, performance }) => {
  return (
    <div id="supplier-details" className="card scroll-mt-24 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Supplier details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Identity, contact, commercial terms, and account status for the current supplier profile.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(supplier?.supplyStatus)}`}>
            {supplier?.supplyStatus || 'unknown'}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(supplier?.paymentStatus)}`}>
            payment {supplier?.paymentStatus || 'pending'}
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Building2 className="h-4 w-4 text-teal-600" />
            Company
          </div>
          <p className="mt-3 text-base font-semibold text-slate-900">{supplier?.companyName || 'Company name not set'}</p>
          <p className="mt-1 text-sm text-slate-600">Supplier: {supplier?.name || '-'}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Mail className="h-4 w-4 text-cyan-600" />
            Email
          </div>
          <p className="mt-3 text-base font-semibold text-slate-900">{supplier?.contact?.email || user?.email || '-'}</p>
          <p className="mt-1 text-sm text-slate-600">Primary contact channel</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Phone className="h-4 w-4 text-blue-600" />
            Phone
          </div>
          <p className="mt-3 text-base font-semibold text-slate-900">{supplier?.contact?.phone || 'No phone recorded'}</p>
          <p className="mt-1 text-sm text-slate-600">Direct line for purchase orders</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <MapPin className="h-4 w-4 text-rose-600" />
            Address
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {[supplier?.address?.street, supplier?.address?.city, supplier?.address?.state, supplier?.address?.country]
              .filter(Boolean)
              .join(', ') || 'No address recorded'}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Terms
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Preferred supplier: {formatBoolean(supplier?.preferredSupplier)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Delivery price: {supplier?.deliveryPricePerItem != null ? formatCurrency(supplier.deliveryPricePerItem) : 'Not set'}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <CalendarDays className="h-4 w-4 text-amber-600" />
            Account
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">Created {formatDate(supplier?.createdAt)}</p>
          <p className="mt-1 text-sm text-slate-600">Updated {formatDate(supplier?.updatedAt)}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Return policy</p>
          <p className="mt-2 text-sm text-slate-700">
            Damaged returns: <span className="font-semibold">{formatBoolean(supplier?.returnPolicy?.acceptsDamagedReturns)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Expired exchanges: <span className="font-semibold">{formatBoolean(supplier?.returnPolicy?.acceptsExpiredExchanges)}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Delivery commitment</p>
          <p className="mt-2 text-sm text-slate-700">
            On-time delivery: <span className="font-semibold">{formatBoolean(supplier?.deliveryCommitment?.deliversOnTime)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Outstanding invoices: <span className="font-semibold">{stats?.overdueInvoices ?? 0}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Performance</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {Number(performance?.rating || 0).toFixed(1)}
            <span className="text-base font-semibold text-slate-500"> / 5</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            On-time delivery {Number(performance?.onTimeDeliveryRate || 0).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupplierProfileDetails;
