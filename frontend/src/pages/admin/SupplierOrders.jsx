import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Search,
  Send,
  Truck
} from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const getStatusClasses = (status) => {
  switch (status) {
    case 'sent':
      return 'bg-emerald-100 text-emerald-800';
    case 'approved':
      return 'bg-cyan-100 text-cyan-800';
    case 'suggested':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const SupplierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editableQuantities, setEditableQuantities] = useState({});
  const [manualOrder, setManualOrder] = useState({
    supplier: '',
    medicineId: '',
    quantity: '1',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchManualOrderOptions();
  }, []);

  const fetchManualOrderOptions = async () => {
    try {
      const [supplierResponse, medicineResponse] = await Promise.all([
        axios.get('/api/suppliers'),
        axios.get('/api/medicines?summary=true')
      ]);

      setSuppliers((supplierResponse.data.suppliers || []).filter((supplier) => supplier.supplyStatus === 'active'));
      setMedicines(medicineResponse.data.medicines || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load manual order options');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/supplier-orders');
      const nextOrders = response.data.orders || [];
      setOrders(nextOrders);
      setEditableQuantities(
        nextOrders.reduce((acc, order) => {
          acc[order._id] = (order.items || []).map((item) => String(item.recommendedQuantity || 1));
          return acc;
        }, {})
      );
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load supplier orders');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (orderId, itemIndex, value) => {
    setEditableQuantities((prev) => ({
      ...prev,
      [orderId]: (prev[orderId] || []).map((quantity, index) => (
        index === itemIndex ? value.replace(/\D/g, '') : quantity
      ))
    }));
  };

  const approveOrder = async (order) => {
    try {
      const items = (order.items || []).map((item, index) => ({
        ...item,
        recommendedQuantity: Math.max(1, Number(editableQuantities[order._id]?.[index] || item.recommendedQuantity || 1))
      }));
      const response = await axios.put(`/api/supplier-orders/${order._id}/approve`, { items });
      setSuccessMessage(response.data?.message || 'Purchase order sent successfully.');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve purchase order');
      setSuccessMessage('');
    }
  };

  const createManualOrder = async () => {
    const selectedMedicine = medicines.find((medicine) => medicine._id === manualOrder.medicineId);

    if (!manualOrder.supplier || !selectedMedicine) {
      setError('Please select a supplier and a medicine for the manual order.');
      return;
    }

    const quantity = Math.max(1, Number(manualOrder.quantity || 1));

    try {
      const response = await axios.post('/api/supplier-orders', {
        supplier: manualOrder.supplier,
        sendNow: true,
        notes: manualOrder.notes,
        items: [
          {
            medicine: selectedMedicine._id,
            productName: selectedMedicine.name,
            currentStock: Number(selectedMedicine.totalStock ?? selectedMedicine.stockQuantity ?? 0),
            reorderLevel: Number(selectedMedicine.thresholdValue || 10),
            recommendedQuantity: quantity,
            unitPrice: Number(selectedMedicine.sellingPrice ?? selectedMedicine.price ?? 0),
            moq: 1,
            leadTime: '',
            recommendationReason: 'Manually placed supplier order by admin.'
          }
        ]
      });

      setSuccessMessage(response.data?.message || 'Manual purchase order placed successfully.');
      setError('');
      setManualOrder({
        supplier: '',
        medicineId: '',
        quantity: '1',
        notes: ''
      });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place manual purchase order');
      setSuccessMessage('');
    }
  };

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        order.orderId?.toLowerCase().includes(normalizedSearch) ||
        order.supplier?.name?.toLowerCase().includes(normalizedSearch) ||
        order.items?.some((item) => item.productName?.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    suggested: orders.filter((order) => order.status === 'suggested').length,
    sent: orders.filter((order) => order.status === 'sent').length,
    lowStockItems: orders.reduce((sum, order) => sum + (order.items?.length || 0), 0)
  }), [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Supplier Orders"
        subtitle="Low-stock medicines now generate suggested purchase orders automatically, with recommended quantities and best supplier guidance."
        icon={Truck}
        stats={[
          { label: 'Suggested POs', value: stats.suggested },
          { label: 'Sent Orders', value: stats.sent },
          { label: 'Low-Stock Items', value: stats.lowStockItems }
        ]}
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchase orders, suppliers, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="all">All Status</option>
            <option value="suggested">Suggested</option>
            <option value="sent">Sent</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Manual Place Order</h3>
            <p className="mt-1 text-sm text-slate-600">
              Create and place a supplier order manually without waiting for the auto-generated low-stock flow.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="label">Supplier</label>
              <select
                value={manualOrder.supplier}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, supplier: e.target.value }))}
                className="input"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Medicine</label>
              <select
                value={manualOrder.medicineId}
                onChange={(e) => setManualOrder((prev) => ({ ...prev, medicineId: e.target.value }))}
                className="input"
              >
                <option value="">Select Medicine</option>
                {medicines.map((medicine) => (
                  <option key={medicine._id} value={medicine._id}>
                    {medicine.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Quantity</label>
              <input
                type="text"
                value={manualOrder.quantity}
                onChange={(e) => setManualOrder((prev) => ({
                  ...prev,
                  quantity: e.target.value.replace(/\D/g, '') || '1'
                }))}
                className="input"
                inputMode="numeric"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={createManualOrder}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-700"
              >
                <Send className="h-4 w-4" />
                Place Manual Order
              </button>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={manualOrder.notes}
              onChange={(e) => setManualOrder((prev) => ({ ...prev, notes: e.target.value }))}
              className="input min-h-[96px]"
              placeholder="Add notes for this supplier order"
            />
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <FilePlus2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No purchase orders found</h3>
          <p className="mt-2 text-sm text-gray-600">
            Suggested purchase orders will appear here automatically when stock falls below reorder levels.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="card">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{order.orderId}</h3>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(order.status)}`}>
                      {order.status}
                    </span>
                    {order.isAutoSuggested && (
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Auto Suggested
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Best supplier suggestion: <span className="font-medium text-slate-900">{order.supplier?.name || 'Unknown supplier'}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Items: {order.items?.length || 0}</span>
                    <span>Total: {formatCurrency(order.totalAmount)}</span>
                    <span>
                      Expected Delivery:{' '}
                      {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'Not calculated'}
                    </span>
                    <span>Communication: {order.communicationStatus || 'draft'}</span>
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${
                  order.status === 'suggested'
                    ? 'border-cyan-200 bg-cyan-50'
                    : order.status === 'sent'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className={`text-sm font-semibold ${
                        order.status === 'suggested'
                          ? 'text-cyan-900'
                          : order.status === 'sent'
                            ? 'text-emerald-900'
                            : 'text-slate-900'
                      }`}>
                        Place Order Section
                      </h4>
                      <p className={`mt-1 text-sm ${
                        order.status === 'suggested'
                          ? 'text-cyan-800'
                          : order.status === 'sent'
                            ? 'text-emerald-800'
                            : 'text-slate-700'
                      }`}>
                        {order.status === 'suggested'
                          ? 'Edit the `Recommended Qty` values if needed, then click `Place Order` to send this purchase order to the supplier.'
                          : order.status === 'sent'
                            ? `This purchase order has already been placed with ${order.supplier?.name || 'the supplier'}.`
                            : 'This purchase order is not in draft mode.'}
                      </p>
                    </div>
                    {order.status === 'suggested' ? (
                      <button
                        type="button"
                        onClick={() => approveOrder(order)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
                      >
                        <Send className="h-4 w-4" />
                        Place Order
                      </button>
                    ) : order.status === 'sent' ? (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                        <CheckCircle2 className="h-4 w-4" />
                        Order Placed
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-4 py-2 text-sm font-medium text-white">
                        <CheckCircle2 className="h-4 w-4" />
                        {order.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Low-Stock Item</th>
                      <th className="px-4 py-3">Current Stock</th>
                      <th className="px-4 py-3">Reorder Level</th>
                      <th className="px-4 py-3">Recommended Qty</th>
                      <th className="px-4 py-3">Supplier Suggestion</th>
                      <th className="px-4 py-3">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items?.map((item, index) => (
                      <tr key={`${order._id}-${index}`}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">{item.productName}</div>
                          <p className="mt-1 text-xs text-slate-500">{item.recommendationReason}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {item.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">{item.reorderLevel}</td>
                        <td className="px-4 py-4">
                          {order.status === 'suggested' ? (
                            <input
                              type="text"
                              value={editableQuantities[order._id]?.[index] ?? String(item.recommendedQuantity || 1)}
                              onChange={(e) => handleQuantityChange(order._id, index, e.target.value)}
                              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                              inputMode="numeric"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-slate-900">{item.recommendedQuantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">MOQ: {item.moq || 1}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">Lead Time: {item.leadTime || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatCurrency(item.unitPrice)} each</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock3 className="h-4 w-4 text-amber-500" />
                    Supplier Lead Window
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {order.items?.map((item) => item.leadTime).filter(Boolean).join(', ') || 'No lead time provided'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Approval Flow
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Admin or pharmacist approval sends this PO to the supplier as an in-system order.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Truck className="h-4 w-4 text-cyan-500" />
                    Inventory Trigger
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Draft created automatically when stock drops to or below the reorder level.
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierOrders;
