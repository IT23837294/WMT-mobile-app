import React from 'react';
import { ArrowRight, ListOrdered, TrendingUp } from 'lucide-react';
import { formatCount, formatCurrency } from './supplierDashboardUtils';

const Performance = ({ orderStats, monthlyStatements, supplier }) => {
  return (
    <div id="performance" className="card scroll-mt-24 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-900">Operational snapshot</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">A quick summary of supplier health, orders, and cash flow.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total orders</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCount(orderStats?.ordersCount || 0)}</p>
          <p className="mt-1 text-sm text-slate-600">Across all statuses</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order value</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(orderStats?.totalValue || 0)}</p>
          <p className="mt-1 text-sm text-slate-600">Sum of recent purchase orders</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sent</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCount(orderStats?.statusCounts?.sent || 0)}</p>
          <p className="mt-1 text-sm text-slate-600">Orders dispatched to the supplier</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Completed</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCount(orderStats?.statusCounts?.completed || 0)}</p>
          <p className="mt-1 text-sm text-slate-600">Closed or fulfilled orders</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          <p className="text-sm font-semibold text-slate-900">Monthly statements</p>
        </div>
        <div className="mt-3 space-y-2">
          {monthlyStatements?.length > 0 ? monthlyStatements.slice(0, 3).map((statement) => (
            <div key={statement.month} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{statement.month}</span>
              <span className="font-semibold text-slate-900">{formatCurrency(statement.balance)}</span>
            </div>
          )) : (
            <p className="text-sm text-slate-500">No monthly statement data yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top products</p>
        <div className="mt-3 space-y-2">
          {supplier?.products?.length > 0 ? supplier.products.slice(0, 4).map((product) => (
            <div key={product} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{product}</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          )) : (
            <p className="text-sm text-slate-500">No products listed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;
