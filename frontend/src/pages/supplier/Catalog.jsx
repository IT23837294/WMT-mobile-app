import React from 'react';
import { formatCurrency } from './supplierDashboardUtils';

const Catalog = ({ supplier }) => {
  return (
    <div id="catalog" className="card scroll-mt-24">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Your catalog</h2>
          <p className="mt-1 text-sm text-slate-500">Products and price points currently associated with your supplier record.</p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          {supplier?.suppliedItems?.length || 0} items
        </span>
      </div>

      {supplier?.suppliedItems?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">MOQ</th>
                <th className="pb-3">Lead time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplier.suppliedItems.map((item) => (
                <tr key={item._id || item.productName}>
                  <td className="py-4 pr-4">
                    <p className="font-medium text-slate-900">{item.productName}</p>
                  </td>
                  <td className="py-4 pr-4 text-sm text-slate-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 pr-4 text-sm text-slate-600">{item.moq || 1}</td>
                  <td className="py-4 text-sm text-slate-600">{item.leadTime || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          No catalog items are linked to this supplier yet.
        </div>
      )}
    </div>
  );
};

export default Catalog;
