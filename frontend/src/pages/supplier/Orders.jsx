import React from 'react';
import { BadgeDollarSign, BadgeInfo, Clock3, Truck } from 'lucide-react';
import { formatCount, formatCurrency, formatDate, getOrderStatusLabel, getStatusClass } from './supplierDashboardUtils';

const Orders = ({ orders, orderStats, selectedOrder, onSelectOrder }) => {
  return (
    <div id="orders" className="card scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Order details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Click a purchase order to inspect delivery timing, approval history, and item lines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {orders.length} orders
          </span>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {formatCurrency(orderStats?.totalValue || 0)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {orders.length > 0 ? (
            orders.map((order) => {
              const isSelected = selectedOrder?._id === order._id;

              return (
                <button
                  key={order._id}
                  type="button"
                  onClick={() => onSelectOrder(order._id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-teal-300 bg-teal-50/80 shadow-[0_12px_30px_rgba(13,148,136,0.10)]'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{order.orderId}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {order.items?.length || 0} item(s) - Created {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <BadgeDollarSign className="h-4 w-4" />
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-4 w-4" />
                      {formatDate(order.expectedDeliveryDate)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(order.items || []).slice(0, 2).map((item) => (
                      <span
                        key={item.medicine || item.productName}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {item.productName} x {item.recommendedQuantity}
                      </span>
                    ))}
                    {(order.items || []).length > 2 ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                        +{order.items.length - 2} more
                      </span>
                    ) : null}
                  </div>

                  {order.notes ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{order.notes}</p>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No purchase orders have been linked to this supplier yet.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {selectedOrder ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                    <BadgeInfo className="h-3.5 w-3.5" />
                    Selected order
                  </div>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{selectedOrder.orderId}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Created {formatDate(selectedOrder.createdAt)} - {selectedOrder.items?.length || 0} item lines
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(selectedOrder.status)}`}>
                  {getOrderStatusLabel(selectedOrder.status)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total amount</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</p>
                  <p className="mt-1 text-sm text-slate-600">Communication: {selectedOrder.communicationStatus || 'draft'}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Delivery window</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{formatDate(selectedOrder.expectedDeliveryDate)}</p>
                  <p className="mt-1 text-sm text-slate-600">Expected delivery date</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Approved by</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{selectedOrder.approvedBy?.name || 'System'}</p>
                  <p className="mt-1 text-sm text-slate-600">Approved {formatDate(selectedOrder.approvedAt)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order size</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{formatCount(selectedOrder.items?.length || 0)}</p>
                  <p className="mt-1 text-sm text-slate-600">Item lines in this order</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Order item breakdown</p>
                </div>
                {selectedOrder.items?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Qty</th>
                          <th className="px-4 py-3">Unit</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Stock / Reorder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.medicine || item.productName}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-900">{item.productName}</p>
                                {item.recommendationReason ? (
                                  <p className="mt-1 text-xs text-slate-500">{item.recommendationReason}</p>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{formatCount(item.recommendedQuantity)}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(item.lineTotal)}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {formatCount(item.currentStock)} / {formatCount(item.reorderLevel)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-4 py-5 text-sm text-slate-500">No item lines recorded for this order.</div>
                )}
              </div>

              {selectedOrder.notes ? (
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedOrder.notes}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
              Select a purchase order to see the full detail view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
