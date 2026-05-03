import React from 'react';
import { FileText } from 'lucide-react';
import { formatCurrency, formatDate, getStatusClass } from './supplierDashboardUtils';

const Invoices = ({ invoices }) => {
  return (
    <div id="invoices" className="card scroll-mt-24">
      <div className="mb-5 flex items-center gap-2">
        <FileText className="h-5 w-5 text-teal-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Invoices</h2>
          <p className="mt-1 text-sm text-slate-500">A quick view of payment progress and outstanding balances.</p>
        </div>
      </div>

      {invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="pb-3 pr-4">Invoice</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Paid</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice._id || invoice.invoiceNo}>
                  <td className="py-4 pr-4 font-medium text-slate-900">{invoice.invoiceNo}</td>
                  <td className="py-4 pr-4 text-sm text-slate-600">{formatDate(invoice.invoiceDate)}</td>
                  <td className="py-4 pr-4 text-sm text-slate-600">{formatCurrency(invoice.amount)}</td>
                  <td className="py-4 pr-4 text-sm text-slate-600">{formatCurrency(invoice.amountPaid)}</td>
                  <td className="py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          No invoices have been recorded for this supplier yet.
        </div>
      )}
    </div>
  );
};

export default Invoices;
