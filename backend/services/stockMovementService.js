const Medicine = require('../models/Medicine');
const StockMovement = require('../models/StockMovement');

const createStockMovement = async ({
  medicineId,
  batchId = null,
  batchNo = '',
  transactionType,
  direction,
  quantity,
  beforeQuantity,
  afterQuantity,
  reason,
  changedBy = null,
  referenceType = '',
  referenceId = null,
  notes = ''
}) => {
  return StockMovement.create({
    medicine: medicineId,
    batch: batchId,
    batchNo,
    transactionType,
    direction,
    quantity,
    beforeQuantity,
    afterQuantity,
    reason,
    changedBy,
    referenceType,
    referenceId,
    notes
  });
};

const applyBatchQuantityChange = async ({
  medicineId,
  batchId,
  quantity,
  transactionType,
  direction,
  reason,
  changedBy = null,
  referenceType = '',
  referenceId = null,
  notes = ''
}) => {
  const batch = await Medicine.findById(batchId);

  if (!batch) {
    throw new Error('Batch not found');
  }

  const beforeQuantity = Number(batch.stockQuantity || 0);
  const signedChange = direction === 'IN' ? Number(quantity) : -Number(quantity);
  const afterQuantity = beforeQuantity + signedChange;

  if (afterQuantity < 0) {
    throw new Error('Insufficient stock for this batch movement');
  }

  batch.stockQuantity = afterQuantity;
  await batch.save();

  await createStockMovement({
    medicineId,
    batchId: batch._id,
    batchNo: batch.batchNo || '',
    transactionType,
    direction,
    quantity: Number(quantity),
    beforeQuantity,
    afterQuantity,
    reason,
    changedBy,
    referenceType,
    referenceId,
    notes
  });

  return batch;
};

module.exports = {
  createStockMovement,
  applyBatchQuantityChange
};
