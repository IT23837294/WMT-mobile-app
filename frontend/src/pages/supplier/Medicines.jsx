import React from 'react';
import { Package } from 'lucide-react';
import { formatCurrency, formatDate, getStatusClass } from './supplierDashboardUtils';

const Medicines = ({ medicines }) => {
  return (
    <div id="medicines" className="card scroll-mt-24">
      <div className="mb-5 flex items-center gap-2">
        <Package className="h-5 w-5 text-cyan-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Supplied medicines</h2>
          <p className="mt-1 text-sm text-slate-500">Medicines currently linked to your supplier record in the inventory.</p>
        </div>
      </div>

      {medicines.length > 0 ? (
        <div className="space-y-3">
          {medicines.slice(0, 6).map((medicine) => (
            <div key={medicine._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{medicine.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {medicine.category || 'General'} {medicine.subCategory ? ` - ${medicine.subCategory}` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(medicine.isActive ? 'active' : 'inactive')}`}>
                  {medicine.isActive ? 'active' : 'inactive'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>Stock: {medicine.stockQuantity ?? 0}</span>
                <span>Threshold: {medicine.thresholdValue ?? 0}</span>
                <span>Price: {formatCurrency(medicine.price)}</span>
                <span>Expiry: {formatDate(medicine.expiryDate)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          No active medicines are linked to this supplier yet.
        </div>
      )}
    </div>
  );
};

export default Medicines;
