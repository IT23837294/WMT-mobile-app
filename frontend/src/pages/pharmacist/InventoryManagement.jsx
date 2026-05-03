import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock,
  Filter,
  History,
  Package,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const TABS = {
  list: 'list',
  adjustments: 'adjustments',
  alerts: 'alerts',
  ledger: 'ledger'
};

const STOCK_TRANSACTION_TYPES = [
  'PURCHASE_IN',
  'MANUAL_ADJUSTMENT_IN',
  'MANUAL_ADJUSTMENT_OUT',
  'DAMAGED_WRITEOFF',
  'EXPIRED_WRITEOFF',
  'CUSTOMER_RETURN_IN'
];

const DIRECTION_OUT_TYPES = new Set([
  'MANUAL_ADJUSTMENT_OUT',
  'DAMAGED_WRITEOFF',
  'EXPIRED_WRITEOFF'
]);

const FEFO_OUT_TYPES = new Set([
  'MANUAL_ADJUSTMENT_OUT',
  'DAMAGED_WRITEOFF'
]);

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getStockQuantity = (medicine) => Number(medicine?.stockQuantity ?? medicine?.quantity ?? 0);
const getThreshold = (medicine) => Number(medicine?.thresholdValue ?? medicine?.threshold ?? 10);
const getMedicineExpiry = (medicine) => medicine?.nearestExpiry || medicine?.expiryDate || null;

const getExpiryStatus = (value) => {
  if (!value) {
    return 'Valid';
  }

  const today = getToday();
  const expiryDate = new Date(value);
  expiryDate.setHours(0, 0, 0, 0);

  if (expiryDate < today) {
    return 'Expired';
  }

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() + 30);

  if (expiryDate <= thresholdDate) {
    return 'Near Expiry';
  }

  return 'Valid';
};

const formatDate = (value, includeTime = false) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
};

const sortBatchesByFefo = (batches = []) => (
  batches.slice().sort((a, b) => {
    const dateA = a?.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
    const dateB = b?.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    return String(a?.batchNo || '').localeCompare(String(b?.batchNo || ''));
  })
);

const getExpiryBadgeClasses = (status) => {
  switch (status) {
    case 'Expired':
      return 'bg-slate-200 text-slate-700';
    case 'Near Expiry':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
};

const getAlertBadgeClasses = (type) => {
  switch (type) {
    case 'lowStock':
      return 'bg-red-100 text-red-700';
    case 'nearExpiry':
      return 'bg-orange-100 text-orange-700';
    case 'expired':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState(TABS.list);
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], nearExpiry: [], expired: [] });
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [medicineSearch, setMedicineSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adjustmentSearch, setAdjustmentSearch] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');

  const [showBatchesModal, setShowBatchesModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineBatches, setMedicineBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentMedicine, setAdjustmentMedicine] = useState(null);
  const [adjustmentBatches, setAdjustmentBatches] = useState([]);
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    transactionType: 'PURCHASE_IN',
    quantity: '',
    reason: '',
    createNewBatch: false,
    batchId: '',
    batchNo: '',
    expiryDate: ''
  });

  const fetchDashboardData = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [medicinesRes, alertsRes, movementsRes] = await Promise.all([
        axios.get('/api/medicines', { params: { summary: 'true' } }),
        axios.get('/api/medicines/alerts'),
        axios.get('/api/medicines/stock-movements')
      ]);

      setMedicines(medicinesRes.data.medicines || []);
      setAlerts({
        lowStock: alertsRes.data.alerts?.lowStock || [],
        nearExpiry: alertsRes.data.alerts?.nearExpiry || [],
        expired: alertsRes.data.alerts?.expired || []
      });
      setStockMovements(movementsRes.data.movements || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const categories = useMemo(() => (
    [...new Set(medicines.map((medicine) => medicine.category).filter(Boolean))].sort()
  ), [medicines]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch = medicine.name?.toLowerCase().includes(medicineSearch.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || medicine.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, medicineSearch, medicines]);

  const adjustmentMedicines = useMemo(() => {
    return medicines.filter((medicine) => (
      medicine.name?.toLowerCase().includes(adjustmentSearch.toLowerCase())
      || medicine.category?.toLowerCase().includes(adjustmentSearch.toLowerCase())
    ));
  }, [adjustmentSearch, medicines]);

  const filteredMovements = useMemo(() => {
    return stockMovements.filter((movement) => (
      movement.medicine?.name?.toLowerCase().includes(ledgerSearch.toLowerCase())
    ));
  }, [ledgerSearch, stockMovements]);

  const usesFefoForCurrentAdjustment = FEFO_OUT_TYPES.has(adjustmentForm.transactionType) && !adjustmentForm.createNewBatch;

  const fefoPreview = useMemo(() => {
    if (!usesFefoForCurrentAdjustment) {
      return { allocations: [], remaining: 0 };
    }

    const requestedQuantity = Number(adjustmentForm.quantity || 0);
    if (requestedQuantity <= 0) {
      return { allocations: [], remaining: 0 };
    }

    let remaining = requestedQuantity;
    const today = getToday();
    const allocations = adjustmentBatches
      .filter((batch) => {
        if (batch.isActive === false || getStockQuantity(batch) <= 0 || !batch.expiryDate) {
          return false;
        }

        const expiryDate = new Date(batch.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate >= today;
      })
      .map((batch) => {
        if (remaining <= 0) {
          return null;
        }

        const quantity = Math.min(getStockQuantity(batch), remaining);
        remaining -= quantity;

        return quantity > 0
          ? {
              batchId: batch._id,
              batchNo: batch.batchNo || 'Main Batch',
              expiryDate: batch.expiryDate,
              quantity
            }
          : null;
      })
      .filter(Boolean);

    return { allocations, remaining };
  }, [adjustmentBatches, adjustmentForm.quantity, usesFefoForCurrentAdjustment]);

  const totalAlerts = alerts.lowStock.length + alerts.nearExpiry.length + alerts.expired.length;
  const adjustmentTypesForHeader = new Set(STOCK_TRANSACTION_TYPES);
  const today = getToday();
  const pendingAdjustmentsToday = stockMovements.filter((movement) => {
    const createdAt = new Date(movement.createdAt);
    return createdAt >= today && adjustmentTypesForHeader.has(movement.transactionType);
  }).length;

  const tabItems = [
    { id: TABS.list, label: 'Medicine List', icon: Package },
    { id: TABS.adjustments, label: 'Stock Adjustments', icon: RefreshCw },
    { id: TABS.alerts, label: `Alerts (${totalAlerts})`, icon: AlertTriangle },
    { id: TABS.ledger, label: 'Stock Movement History', icon: History }
  ];

  const handleRefresh = () => {
    setSuccessMessage('');
    fetchDashboardData({ silent: true });
  };

  const loadMedicineBatches = async (medicineId) => {
    const response = await axios.get(`/api/medicines/${medicineId}/batches`);
    return sortBatchesByFefo(response.data.batches || []);
  };

  const openBatchesModal = async (medicine) => {
    setSelectedMedicine(medicine);
    setShowBatchesModal(true);
    setBatchesLoading(true);
    setMedicineBatches([]);
    setError('');

    try {
      const batches = await loadMedicineBatches(medicine._id);
      setMedicineBatches(batches);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load medicine batches');
    } finally {
      setBatchesLoading(false);
    }
  };

  const closeBatchesModal = () => {
    setShowBatchesModal(false);
    setSelectedMedicine(null);
    setMedicineBatches([]);
  };

  const openAdjustmentModal = async (medicine) => {
    setAdjustmentMedicine(medicine);
    setShowAdjustmentModal(true);
    setAdjustmentSubmitting(false);
    setSuccessMessage('');
    setError('');
    setAdjustmentForm({
      transactionType: 'PURCHASE_IN',
      quantity: '',
      reason: '',
      createNewBatch: false,
      batchId: '',
      batchNo: '',
      expiryDate: ''
    });

    try {
      const batches = await loadMedicineBatches(medicine._id);
      setAdjustmentBatches(batches);
      const firstActiveBatch = batches.find((batch) => batch.isActive !== false) || batches[0];
      setAdjustmentForm((prev) => ({
        ...prev,
        batchId: firstActiveBatch?._id || ''
      }));
    } catch (err) {
      setAdjustmentBatches([]);
      setError(err.response?.data?.message || 'Failed to load medicine batches for adjustment');
    }
  };

  const closeAdjustmentModal = () => {
    setShowAdjustmentModal(false);
    setAdjustmentMedicine(null);
    setAdjustmentBatches([]);
    setAdjustmentForm({
      transactionType: 'PURCHASE_IN',
      quantity: '',
      reason: '',
      createNewBatch: false,
      batchId: '',
      batchNo: '',
      expiryDate: ''
    });
  };

  const handleAdjustmentFormChange = (field, value) => {
    setAdjustmentForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateNewBatchToggle = (checked) => {
    setAdjustmentForm((prev) => ({
      ...prev,
      createNewBatch: checked,
      batchId: checked ? '' : (adjustmentBatches[0]?._id || ''),
      batchNo: checked ? prev.batchNo : '',
      expiryDate: checked ? prev.expiryDate : ''
    }));
  };

  const handleSubmitAdjustment = async (event) => {
    event.preventDefault();

    if (!adjustmentMedicine) {
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      setError('Reason is required for audit purposes');
      return;
    }

    if (!adjustmentForm.createNewBatch && !usesFefoForCurrentAdjustment && !adjustmentForm.batchId && adjustmentBatches.length > 0) {
      setError('Please select a batch to adjust');
      return;
    }

    try {
      setAdjustmentSubmitting(true);
      setError('');

      const payload = {
        transactionType: adjustmentForm.transactionType,
        quantity: Number(adjustmentForm.quantity),
        reason: adjustmentForm.reason.trim(),
        createNewBatch: adjustmentForm.createNewBatch,
        batchNo: adjustmentForm.createNewBatch ? adjustmentForm.batchNo.trim() : '',
        expiryDate: adjustmentForm.createNewBatch ? adjustmentForm.expiryDate : undefined,
        batchId: adjustmentForm.createNewBatch ? undefined : adjustmentForm.batchId || undefined
      };

      const response = await axios.post(
        `/api/medicines/${adjustmentMedicine._id}/stock-adjustments`,
        payload
      );

      setSuccessMessage(response.data.message || 'Stock adjustment recorded successfully');
      closeAdjustmentModal();
      await fetchDashboardData({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record stock adjustment');
    } finally {
      setAdjustmentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Inventory Management"
        subtitle="Track active medicines, record stock changes, review inventory alerts, and follow the audit trail from one pharmacist workspace."
        eyebrow="PharmaCare Pharmacist"
        icon={Package}
        stats={[
          { label: 'Total Medicines', value: medicines.length },
          { label: 'Low Stock Count', value: alerts.lowStock.length },
          { label: 'Near Expiry Count', value: alerts.nearExpiry.length },
          { label: 'Pending Adjustments Today', value: pendingAdjustmentsToday }
        ]}
        action={(
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {successMessage}
          <button onClick={() => setSuccessMessage('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-medical-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-medical-200 hover:text-medical-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === TABS.list && (
        <section className="space-y-6">
          <div className="card">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={medicineSearch}
                  onChange={(event) => setMedicineSearch(event.target.value)}
                  placeholder="Search medicines by name"
                  className="input pl-10"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="input pl-10"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">{filteredMedicines.length} active medicines</p>
              <p className="text-sm text-slate-400">Aggregated by medicine</p>
            </div>

            {filteredMedicines.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No medicines found</h3>
                <p className="mt-2 text-sm text-slate-500">Try a different search term or category filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Stock Qty</th>
                      <th className="px-5 py-4">Threshold</th>
                      <th className="px-5 py-4">Expiry Date</th>
                      <th className="px-5 py-4">Expiry Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredMedicines.map((medicine) => {
                      const expiryStatus = getExpiryStatus(getMedicineExpiry(medicine));

                      return (
                        <tr key={medicine._id} className="transition hover:bg-slate-50/80">
                          <td className="px-5 py-4 font-semibold text-slate-900">{medicine.name}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{medicine.category || 'Uncategorized'}</td>
                          <td className="px-5 py-4 text-sm text-slate-900">{getStockQuantity(medicine)}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{getThreshold(medicine)}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(getMedicineExpiry(medicine))}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getExpiryBadgeClasses(expiryStatus)}`}>
                              {expiryStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openBatchesModal(medicine)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-medical-200 hover:text-medical-600"
                              >
                                View Batches
                              </button>
                              <button
                                type="button"
                                onClick={() => openAdjustmentModal(medicine)}
                                className="btn-primary text-sm"
                              >
                                Adjust Stock
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === TABS.adjustments && (
        <section className="space-y-6">
          <div className="card">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={adjustmentSearch}
                onChange={(event) => setAdjustmentSearch(event.target.value)}
                placeholder="Search medicines for stock adjustment"
                className="input pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adjustmentMedicines.map((medicine) => {
              const stockQty = getStockQuantity(medicine);
              const threshold = getThreshold(medicine);

              return (
                <button
                  key={medicine._id}
                  type="button"
                  onClick={() => openAdjustmentModal(medicine)}
                  className="card text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{medicine.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{medicine.category || 'Uncategorized'}</p>
                    </div>
                    <Package className="h-5 w-5 text-medical-600" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Stock Qty</span>
                    <span className="font-semibold text-slate-900">{stockQty}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Threshold</span>
                    <span className="font-semibold text-slate-900">{threshold}</span>
                  </div>
                  <div className="mt-4 text-sm text-medical-600">Open adjustment form</div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === TABS.alerts && (
        <section className="grid gap-6 lg:grid-cols-3">
          {[
            { key: 'lowStock', title: 'Low Stock', icon: AlertTriangle },
            { key: 'nearExpiry', title: 'Near Expiry', icon: Clock },
            { key: 'expired', title: 'Expired', icon: Package }
          ].map((section) => {
            const Icon = section.icon;
            const items = alerts[section.key] || [];

            return (
              <div key={section.key} className="card">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2">
                      <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{section.title}</h3>
                      <p className="text-sm text-slate-500">{items.length} medicines</p>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getAlertBadgeClasses(section.key)}`}>
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No {section.title.toLowerCase()} medicines right now.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((medicine) => (
                      <div key={`${section.key}-${medicine._id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{medicine.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{medicine.category || 'Uncategorized'}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getAlertBadgeClasses(section.key)}`}>
                            {section.title}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          <p>Stock Quantity: {getStockQuantity(medicine)}</p>
                          <p>Expiry Date: {formatDate(medicine.expiryDate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {activeTab === TABS.ledger && (
        <section className="space-y-6">
          <div className="card">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(event) => setLedgerSearch(event.target.value)}
                placeholder="Filter stock movements by medicine name"
                className="input pl-10"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">{filteredMovements.length} movement records</p>
              <p className="text-sm text-slate-400">Latest 200 entries</p>
            </div>

            {filteredMovements.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <History className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No stock movements found</h3>
                <p className="mt-2 text-sm text-slate-500">Try another medicine name or refresh the data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Medicine Name</th>
                      <th className="px-5 py-4">Transaction Type</th>
                      <th className="px-5 py-4">Direction</th>
                      <th className="px-5 py-4">Quantity</th>
                      <th className="px-5 py-4">Before Qty</th>
                      <th className="px-5 py-4">After Qty</th>
                      <th className="px-5 py-4">Reason</th>
                      <th className="px-5 py-4">Changed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredMovements.map((movement) => (
                      <tr key={movement._id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDate(movement.createdAt, true)}</td>
                        <td className="px-5 py-4 font-medium text-slate-900">{movement.medicine?.name || 'Medicine'}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{movement.transactionType}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            movement.direction === 'IN'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {movement.direction === 'IN'
                              ? <ArrowUp className="h-3.5 w-3.5" />
                              : <ArrowDown className="h-3.5 w-3.5" />}
                            {movement.direction}
                          </span>
                        </td>
                        <td className={`px-5 py-4 text-sm font-semibold ${
                          movement.direction === 'IN' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {movement.quantity}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{movement.beforeQuantity}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{movement.afterQuantity}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{movement.reason}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{movement.changedBy?.name || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {showBatchesModal && selectedMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{selectedMedicine.name} Batches</h2>
                <p className="text-sm text-slate-500">Batch-level stock and expiry details</p>
              </div>
              <button onClick={closeBatchesModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {batchesLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-medical-600"></div>
              </div>
            ) : medicineBatches.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-10 text-center text-slate-500">
                No batches found for this medicine.
              </div>
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                  <span className="font-medium">FEFO order:</span>
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Use First</span>
                  <span className="text-cyan-800">Earliest valid expiry should be issued first.</span>
                </div>

                <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Batch No</th>
                      <th className="px-4 py-3">FEFO Order</th>
                      <th className="px-4 py-3">Stock Qty</th>
                      <th className="px-4 py-3">Expiry Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {medicineBatches.map((batch) => {
                      const status = getExpiryStatus(batch.expiryDate);
                      const fefoRank = status !== 'Expired'
                        ? medicineBatches.filter((item) => getExpiryStatus(item.expiryDate) !== 'Expired').findIndex((item) => item._id === batch._id)
                        : -1;

                      return (
                        <tr key={batch._id}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{batch.batchNo || 'Main Batch'}</td>
                          <td className="px-4 py-3">
                            {status === 'Expired' ? (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                Expired
                              </span>
                            ) : fefoRank === 0 ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Use First
                              </span>
                            ) : fefoRank === 1 ? (
                              <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                2nd in queue
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                #{fefoRank + 1} in queue
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{getStockQuantity(batch)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{formatDate(batch.expiryDate)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getExpiryBadgeClasses(status)}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAdjustmentModal && adjustmentMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Stock Adjustment</h2>
                <p className="text-sm text-slate-500">{adjustmentMedicine.name}</p>
              </div>
              <button onClick={closeAdjustmentModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Current Stock</span>
                <span className="font-semibold text-slate-900">{getStockQuantity(adjustmentMedicine)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Threshold</span>
                <span className="font-semibold text-slate-900">{getThreshold(adjustmentMedicine)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              <div>
                <label className="label">Transaction Type</label>
                <select
                  value={adjustmentForm.transactionType}
                  onChange={(event) => handleAdjustmentFormChange('transactionType', event.target.value)}
                  className="input w-full"
                >
                  {STOCK_TRANSACTION_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {!adjustmentForm.createNewBatch && !usesFefoForCurrentAdjustment && adjustmentBatches.length > 0 && (
                <div>
                  <label className="label">Select Batch</label>
                  <select
                    value={adjustmentForm.batchId}
                    onChange={(event) => handleAdjustmentFormChange('batchId', event.target.value)}
                    className="input w-full"
                  >
                    {adjustmentBatches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {(batch.batchNo || 'Main Batch')} | Qty {getStockQuantity(batch)} | {formatDate(batch.expiryDate)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {usesFefoForCurrentAdjustment && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                  <p className="font-medium">FEFO allocation will be applied automatically.</p>
                  <p className="mt-1 text-cyan-800">
                    Stock will be reduced from the earliest-expiring valid batches first.
                  </p>
                  {fefoPreview.allocations.length > 0 && (
                    <div className="mt-3 space-y-1 text-cyan-800">
                      {fefoPreview.allocations.map((allocation) => (
                        <p key={allocation.batchId}>
                          {allocation.batchNo} | Qty {allocation.quantity} | {formatDate(allocation.expiryDate)}
                        </p>
                      ))}
                    </div>
                  )}
                  {Number(adjustmentForm.quantity || 0) > 0 && fefoPreview.remaining > 0 && (
                    <p className="mt-3 text-rose-700">
                      Not enough non-expired batch stock for this quantity. Remaining shortfall: {fefoPreview.remaining}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentForm.quantity}
                  onChange={(event) => handleAdjustmentFormChange('quantity', event.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="label">Reason</label>
                <input
                  type="text"
                  value={adjustmentForm.reason}
                  onChange={(event) => handleAdjustmentFormChange('reason', event.target.value)}
                  className="input w-full"
                  placeholder="Reason is required"
                  required
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={adjustmentForm.createNewBatch}
                    onChange={(event) => handleCreateNewBatchToggle(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Create a new batch
                </label>

                {adjustmentForm.createNewBatch && (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Batch No</label>
                      <input
                        type="text"
                        value={adjustmentForm.batchNo}
                        onChange={(event) => handleAdjustmentFormChange('batchNo', event.target.value)}
                        className="input w-full"
                        required={adjustmentForm.createNewBatch}
                      />
                    </div>
                    <div>
                      <label className="label">Expiry Date</label>
                      <input
                        type="date"
                        value={adjustmentForm.expiryDate}
                        onChange={(event) => handleAdjustmentFormChange('expiryDate', event.target.value)}
                        className="input w-full"
                        required={adjustmentForm.createNewBatch}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {usesFefoForCurrentAdjustment
                  ? 'This transaction will reduce stock using FEFO across eligible batches.'
                  : DIRECTION_OUT_TYPES.has(adjustmentForm.transactionType)
                    ? 'This transaction will reduce stock from the selected batch.'
                  : 'This transaction will add stock to the selected batch or a new batch.'}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeAdjustmentModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={adjustmentSubmitting}>
                  {adjustmentSubmitting ? 'Submitting...' : 'Submit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
