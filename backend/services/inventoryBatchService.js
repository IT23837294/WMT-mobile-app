const Medicine = require('../models/Medicine');
const { applyBatchQuantityChange } = require('./stockMovementService');

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const getToday = () => normalizeDate(new Date());

const getMedicineFamilyFilter = (medicine) => ({
  name: medicine.name,
  category: medicine.category,
  manufacturer: medicine.manufacturer || '',
  dosage: medicine.dosage || '',
  strength: medicine.strength || '',
  supplier: medicine.supplier || null,
  isActive: true
});

const isBatchExpired = (batch) => {
  const expiryDate = normalizeDate(batch.expiryDate);
  const today = getToday();
  return !expiryDate || expiryDate < today;
};

const getSellableBatchesForMedicine = async (medicineId) => {
  const sourceMedicine = await Medicine.findById(medicineId);

  if (!sourceMedicine || !sourceMedicine.isActive) {
    return { sourceMedicine: null, batches: [] };
  }

  const familyFilter = getMedicineFamilyFilter(sourceMedicine);
  const batches = await Medicine.find(familyFilter).sort({ expiryDate: 1, createdAt: 1 });
  const sellableBatches = batches.filter((batch) => !isBatchExpired(batch) && Number(batch.stockQuantity || 0) > 0);

  return {
    sourceMedicine,
    batches: sellableBatches
  };
};

const getAvailableStockForMedicine = async (medicineId) => {
  const { sourceMedicine, batches } = await getSellableBatchesForMedicine(medicineId);
  const availableStock = batches.reduce((sum, batch) => sum + Number(batch.stockQuantity || 0), 0);

  return {
    sourceMedicine,
    availableStock,
    batches
  };
};

const allocateBatchesForMedicine = async (medicineId, requestedQuantity) => {
  const { sourceMedicine, availableStock, batches } = await getAvailableStockForMedicine(medicineId);

  if (!sourceMedicine) {
    return { sourceMedicine: null, availableStock: 0, allocations: [] };
  }

  if (availableStock < requestedQuantity) {
    return { sourceMedicine, availableStock, allocations: [] };
  }

  let remaining = requestedQuantity;
  const allocations = [];

  for (const batch of batches) {
    if (remaining <= 0) {
      break;
    }

    const batchStock = Number(batch.stockQuantity || 0);
    const quantity = Math.min(batchStock, remaining);

    if (quantity > 0) {
      allocations.push({
        batch: batch._id,
        batchNo: batch.batchNo || '',
        expiryDate: batch.expiryDate,
        quantity
      });
      remaining -= quantity;
    }
  }

  return {
    sourceMedicine,
    availableStock,
    allocations
  };
};

const reduceBatchAllocations = async (allocations = [], context = {}) => {
  for (const allocation of allocations) {
    await applyBatchQuantityChange({
      medicineId: context.medicineId,
      batchId: allocation.batch,
      quantity: Number(allocation.quantity || 0),
      transactionType: context.transactionType || 'SALE_OUT',
      direction: 'OUT',
      reason: context.reason || 'Stock issued using FEFO allocation',
      changedBy: context.changedBy || null,
      referenceType: context.referenceType || '',
      referenceId: context.referenceId || null,
      notes: context.notes || ''
    });
  }
};

const restoreBatchAllocations = async (allocations = [], context = {}) => {
  for (const allocation of allocations) {
    await applyBatchQuantityChange({
      medicineId: context.medicineId,
      batchId: allocation.batch,
      quantity: Number(allocation.quantity || 0),
      transactionType: context.transactionType || 'CUSTOMER_RETURN_IN',
      direction: 'IN',
      reason: context.reason || 'Stock restored back to inventory',
      changedBy: context.changedBy || null,
      referenceType: context.referenceType || '',
      referenceId: context.referenceId || null,
      notes: context.notes || ''
    });
  }
};

module.exports = {
  isBatchExpired,
  getAvailableStockForMedicine,
  allocateBatchesForMedicine,
  reduceBatchAllocations,
  restoreBatchAllocations
};
