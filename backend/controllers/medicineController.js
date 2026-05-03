const Medicine = require('../models/Medicine');
const StockMovement = require('../models/StockMovement');
const fs = require('fs');
const path = require('path');
const { createStockMovement, applyBatchQuantityChange } = require('../services/stockMovementService');
const { allocateBatchesForMedicine, reduceBatchAllocations } = require('../services/inventoryBatchService');

const FEFO_OUT_TRANSACTION_TYPES = new Set([
  'MANUAL_ADJUSTMENT_OUT',
  'DAMAGED_WRITEOFF'
]);

const getMedicineIdentityFilter = (medicine) => ({
  name: medicine.name,
  category: medicine.category,
  manufacturer: medicine.manufacturer || '',
  dosage: medicine.dosage || '',
  strength: medicine.strength || '',
  supplier: medicine.supplier || null,
  isActive: true
});

const isPastExpiryDate = (value) => {
  const expiryDate = new Date(value);

  if (Number.isNaN(expiryDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return expiryDate < today;
};

exports.getAllMedicines = async (req, res) => {
  try {
    const { category, search, requiresPrescription, lowStock, nearExpiry, summary } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (requiresPrescription) query.requiresPrescription = requiresPrescription === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (summary === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const farFutureDate = new Date('9999-12-31T00:00:00.000Z');
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      let medicines = await Medicine.aggregate([
        { $match: query },
        {
          $addFields: {
            validBatchQty: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$expiryDate', today] },
                    { $gt: ['$stockQuantity', 0] }
                  ]
                },
                '$stockQuantity',
                0
              ]
            },
            validBatchExpiry: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$expiryDate', today] },
                    { $gt: ['$stockQuantity', 0] }
                  ]
                },
                '$expiryDate',
                farFutureDate
              ]
            }
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $toLower: {
                $trim: {
                  input: '$name'
                }
              }
            },
            medicineId: { $first: '$_id' },
            name: { $first: '$name' },
            category: { $first: '$category' },
            subCategory: { $first: '$subCategory' },
            description: { $first: '$description' },
            price: { $first: '$price' },
            sellingPrice: { $first: '$sellingPrice' },
            image: { $first: '$image' },
            manufacturer: { $first: '$manufacturer' },
            supplier: { $first: '$supplier' },
            requiresPrescription: { $first: '$requiresPrescription' },
            dosage: { $first: '$dosage' },
            strength: { $first: '$strength' },
            sideEffects: { $first: '$sideEffects' },
            thresholdValue: { $max: '$thresholdValue' },
            totalStock: { $sum: '$validBatchQty' },
            nearestExpiryRaw: { $min: '$validBatchExpiry' }
          }
        },
        {
          $addFields: {
            nearestExpiry: {
              $cond: [
                { $eq: ['$nearestExpiryRaw', farFutureDate] },
                null,
                '$nearestExpiryRaw'
              ]
            }
          }
        },
        {
          $project: {
            _id: '$medicineId',
            name: 1,
            category: 1,
            subCategory: 1,
            description: 1,
            price: 1,
            sellingPrice: 1,
            image: 1,
            manufacturer: 1,
            supplier: 1,
            requiresPrescription: 1,
            dosage: 1,
            strength: 1,
            sideEffects: 1,
            thresholdValue: 1,
            totalStock: 1,
            stockQuantity: '$totalStock',
            nearestExpiry: 1,
            stockStatus: {
              $cond: [{ $gt: ['$totalStock', 0] }, 'In Stock', 'Out of Stock']
            }
          }
        },
        { $sort: { name: 1 } }
      ]);

      if (lowStock === 'true') {
        medicines = medicines.filter((medicine) => Number(medicine.totalStock || 0) <= Number(medicine.thresholdValue || 10));
      }

      if (nearExpiry === 'true') {
        medicines = medicines.filter((medicine) =>
          medicine.nearestExpiry &&
          new Date(medicine.nearestExpiry) <= thirtyDaysFromNow &&
          new Date(medicine.nearestExpiry) >= today
        );
      }

      return res.json({
        success: true,
        count: medicines.length,
        medicines
      });
    }

    let medicines = await Medicine.find(query)
      .populate('supplier', 'name')
      .sort({ createdAt: -1 });

    // Filter low stock and near expiry in memory since they're virtuals
    if (lowStock === 'true') {
      medicines = medicines.filter(m => Number(m.stockQuantity || 0) <= Number(m.thresholdValue || 10));
    }
    if (nearExpiry === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      medicines = medicines.filter(m => m.expiryDate <= thirtyDaysFromNow && m.expiryDate > new Date());
    }

    res.json({
      success: true,
      count: medicines.length,
      medicines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('supplier', 'name contact');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      medicine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMedicineBatches = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const batches = await Medicine.find(getMedicineIdentityFilter(medicine))
      .populate('supplier', 'name')
      .sort({ expiryDate: 1, createdAt: 1 });

    res.json({
      success: true,
      batches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    if (isPastExpiryDate(req.body.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date cannot be in the past'
      });
    }

    const medicineData = {
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image || null
    };

    const medicine = await Medicine.create(medicineData);

    res.status(201).json({
      success: true,
      medicine
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createMedicineBatch = async (req, res) => {
  try {
    const sourceMedicine = await Medicine.findById(req.params.id);

    if (!sourceMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const { batchNo, expiryDate, stockQuantity } = req.body;
    const parsedQuantity = Number.parseInt(stockQuantity, 10);

    if (!batchNo || !expiryDate || !Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Batch number, expiry date, and quantity are required'
      });
    }

    if (isPastExpiryDate(expiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date cannot be in the past'
      });
    }

    const batch = await Medicine.create({
      name: sourceMedicine.name,
      category: sourceMedicine.category,
      description: sourceMedicine.description,
      price: sourceMedicine.price,
      costPrice: sourceMedicine.costPrice,
      sellingPrice: sourceMedicine.sellingPrice,
      stockQuantity: parsedQuantity,
      expiryDate,
      manufacturer: sourceMedicine.manufacturer,
      supplier: sourceMedicine.supplier,
      requiresPrescription: sourceMedicine.requiresPrescription,
      dosage: sourceMedicine.dosage,
      strength: sourceMedicine.strength,
      batchNo,
      sideEffects: sourceMedicine.sideEffects,
      image: sourceMedicine.image,
      isActive: true
    });

    await createStockMovement({
      medicineId: sourceMedicine._id,
      batchId: batch._id,
      batchNo: batch.batchNo || '',
      transactionType: 'PURCHASE_IN',
      direction: 'IN',
      quantity: parsedQuantity,
      beforeQuantity: 0,
      afterQuantity: parsedQuantity,
      reason: 'Purchase IN / GRN stock-in',
      changedBy: req.user?._id || null,
      referenceType: 'MedicineBatch',
      referenceId: batch._id,
      notes: `New batch ${batch.batchNo || ''} received into stock`
    });

    res.status(201).json({
      success: true,
      batch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    if (req.body.expiryDate && isPastExpiryDate(req.body.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date cannot be in the past'
      });
    }

    const existingMedicine = await Medicine.findById(req.params.id);

    if (!existingMedicine) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const updateData = {
      ...req.body
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (req.file && existingMedicine.image && existingMedicine.image.startsWith('/uploads/')) {
      const oldImagePath = path.join(__dirname, '..', existingMedicine.image.replace(/^\//, ''));
      fs.unlink(oldImagePath, () => {});
    }

    res.json({
      success: true,
      medicine
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateMedicineBatch = async (req, res) => {
  try {
    const sourceMedicine = await Medicine.findById(req.params.id);

    if (!sourceMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const batch = await Medicine.findById(req.params.batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const batchFamily = getMedicineIdentityFilter(sourceMedicine);
    const matchesFamily = 
      batch.name === batchFamily.name &&
      batch.category === batchFamily.category &&
      (batch.manufacturer || '') === batchFamily.manufacturer &&
      (batch.dosage || '') === batchFamily.dosage &&
      (batch.strength || '') === batchFamily.strength &&
      String(batch.supplier || '') === String(batchFamily.supplier || '');

    if (!matchesFamily) {
      return res.status(400).json({
        success: false,
        message: 'This batch does not belong to the selected medicine'
      });
    }

    const updateData = {};

    if (req.body.stockQuantity !== undefined) {
      const parsedQuantity = Number.parseInt(req.body.stockQuantity, 10);

      if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock quantity must be a valid non-negative number'
        });
      }

      updateData.stockQuantity = parsedQuantity;
    }

    if (req.body.expiryDate) {
      if (isPastExpiryDate(req.body.expiryDate)) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date cannot be in the past'
        });
      }

      updateData.expiryDate = req.body.expiryDate;
    }

    if (req.body.batchNo !== undefined) {
      updateData.batchNo = req.body.batchNo;
    }

    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === true || req.body.isActive === 'true';
    }

    const updatedBatch = await Medicine.findByIdAndUpdate(
      req.params.batchId,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier', 'name');

    res.json({
      success: true,
      batch: updatedBatch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStockMovements = async (req, res) => {
  try {
    const query = {};

    if (req.query.medicineId) {
      query.medicine = req.query.medicineId;
    }

    const movements = await StockMovement.find(query)
      .populate('medicine', 'name category')
      .populate('batch', 'batchNo expiryDate')
      .populate('changedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      count: movements.length,
      movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createStockAdjustment = async (req, res) => {
  try {
    const sourceMedicine = await Medicine.findById(req.params.id);

    if (!sourceMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const {
      quantity,
      reason,
      transactionType,
      createNewBatch = false,
      batchNo = '',
      expiryDate,
      batchId
    } = req.body;

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid positive number'
      });
    }

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for audit purposes'
      });
    }

    if (createNewBatch === true || createNewBatch === 'true') {
      if (!batchNo?.trim() || !expiryDate) {
        return res.status(400).json({
          success: false,
          message: 'Batch / LOT number and expiry date are required for new batch stock-in'
        });
      }

      if (isPastExpiryDate(expiryDate)) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date cannot be in the past'
        });
      }

      const batch = await Medicine.create({
        name: sourceMedicine.name,
        category: sourceMedicine.category,
        description: sourceMedicine.description,
        price: sourceMedicine.price,
        costPrice: sourceMedicine.costPrice,
        sellingPrice: sourceMedicine.sellingPrice,
        stockQuantity: parsedQuantity,
        thresholdValue: sourceMedicine.thresholdValue,
        expiryDate,
        manufacturer: sourceMedicine.manufacturer,
        supplier: sourceMedicine.supplier,
        requiresPrescription: sourceMedicine.requiresPrescription,
        dosage: sourceMedicine.dosage,
        strength: sourceMedicine.strength,
        batchNo: batchNo.trim(),
        sideEffects: sourceMedicine.sideEffects,
        image: sourceMedicine.image,
        isActive: true
      });

      await createStockMovement({
        medicineId: sourceMedicine._id,
        batchId: batch._id,
        batchNo: batch.batchNo || '',
        transactionType: transactionType || 'PURCHASE_IN',
        direction: 'IN',
        quantity: parsedQuantity,
        beforeQuantity: 0,
        afterQuantity: parsedQuantity,
        reason: reason.trim(),
        changedBy: req.user?._id || null,
        referenceType: 'ManualAdjustment',
        referenceId: batch._id,
        notes: 'Batch created through stock adjustment'
      });

      return res.status(201).json({
        success: true,
        message: 'New batch recorded successfully',
        batch
      });
    }

    const targetBatch = batchId
      ? await Medicine.findById(batchId)
      : sourceMedicine;

    if (!targetBatch) {
      return res.status(404).json({
        success: false,
        message: 'Target batch not found'
      });
    }

    const resolvedTransactionType = transactionType || 'MANUAL_ADJUSTMENT_IN';
    const direction = ['SALE_OUT', 'CUSTOMER_RETURN_OUT', 'DAMAGED_WRITEOFF', 'EXPIRED_WRITEOFF', 'MANUAL_ADJUSTMENT_OUT'].includes(resolvedTransactionType)
      ? 'OUT'
      : 'IN';

    if (direction === 'OUT' && FEFO_OUT_TRANSACTION_TYPES.has(resolvedTransactionType)) {
      const allocationResult = await allocateBatchesForMedicine(sourceMedicine._id, parsedQuantity);

      if (!allocationResult.sourceMedicine) {
        return res.status(404).json({
          success: false,
          message: 'Medicine not found'
        });
      }

      if (!allocationResult.allocations.length) {
        return res.status(400).json({
          success: false,
          message: `Insufficient non-expired batch stock available. Only ${allocationResult.availableStock} units can be issued using FEFO.`
        });
      }

      await reduceBatchAllocations(allocationResult.allocations, {
        medicineId: sourceMedicine._id,
        transactionType: resolvedTransactionType,
        reason: reason.trim(),
        changedBy: req.user?._id || null,
        referenceType: 'ManualAdjustment',
        referenceId: sourceMedicine._id,
        notes: `Manual inventory movement by ${req.user?.name || 'system'} using FEFO batch allocation`
      });

      return res.json({
        success: true,
        message: 'Stock adjustment recorded successfully using FEFO batch allocation',
        allocations: allocationResult.allocations
      });
    }

    const updatedBatch = await applyBatchQuantityChange({
      medicineId: sourceMedicine._id,
      batchId: targetBatch._id,
      quantity: parsedQuantity,
      transactionType: resolvedTransactionType,
      direction,
      reason: reason.trim(),
      changedBy: req.user?._id || null,
      referenceType: 'ManualAdjustment',
      referenceId: targetBatch._id,
      notes: `Manual inventory movement by ${req.user?.name || 'system'}`
    });

    res.json({
      success: true,
      message: 'Stock adjustment recorded successfully',
      batch: updatedBatch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deactivateMedicineBatch = async (req, res) => {
  try {
    const sourceMedicine = await Medicine.findById(req.params.id);

    if (!sourceMedicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const batch = await Medicine.findById(req.params.batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const batchFamily = getMedicineIdentityFilter(sourceMedicine);
    const matchesFamily =
      batch.name === batchFamily.name &&
      batch.category === batchFamily.category &&
      (batch.manufacturer || '') === batchFamily.manufacturer &&
      (batch.dosage || '') === batchFamily.dosage &&
      (batch.strength || '') === batchFamily.strength &&
      String(batch.supplier || '') === String(batchFamily.supplier || '');

    if (!matchesFamily) {
      return res.status(400).json({
        success: false,
        message: 'This batch does not belong to the selected medicine'
      });
    }

    batch.isActive = false;
    await batch.save();

    res.json({
      success: true,
      message: 'Batch deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const lowStockCandidates = await Medicine.find({
      isActive: true
    }).populate('supplier', 'name');

    const lowStock = lowStockCandidates.filter((medicine) =>
      Number(medicine.stockQuantity || 0) <= Number(medicine.thresholdValue || 10)
    );

    const nearExpiry = await Medicine.find({
      isActive: true,
      expiryDate: { $lte: thirtyDaysFromNow, $gt: new Date() }
    }).populate('supplier', 'name');

    const expired = await Medicine.find({
      isActive: true,
      expiryDate: { $lt: new Date() }
    }).populate('supplier', 'name');

    res.json({
      success: true,
      alerts: {
        lowStock,
        nearExpiry,
        expired,
        totalAlerts: lowStock.length + nearExpiry.length + expired.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.removeExpiredMedicines = async (req, res) => {
  try {
    const result = await Medicine.updateMany(
      { expiryDate: { $lt: new Date() }, isActive: true },
      { isActive: false }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} expired medicines removed from active inventory`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
