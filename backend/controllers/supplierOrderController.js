const Supplier = require('../models/Supplier');
const SupplierOrder = require('../models/SupplierOrder');
const Medicine = require('../models/Medicine');

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parseLeadTimeDays = (leadTime = '') => {
  const matches = String(leadTime).match(/\d+/g);
  if (!matches || matches.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...matches.map((value) => Number(value)));
};

const buildOrderId = () => `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const normalizeValue = (value = '') => String(value || '').trim().toLowerCase();

const getMedicineKeywords = (medicine) => (
  [
    medicine.name,
    medicine.subCategory,
    medicine.category,
    medicine.manufacturer
  ]
    .map(normalizeValue)
    .filter(Boolean)
);

const getMedicineSupplierId = (medicine) => String(medicine.supplier?._id || medicine.supplier || '');

const getCatalogMatch = (supplier, medicine) => {
  const medicineKeywords = getMedicineKeywords(medicine);

  return (supplier.suppliedItems || []).find((item) => {
    const productName = normalizeValue(item.productName);

    if (!productName) {
      return false;
    }

    return medicineKeywords.some((keyword) =>
      productName === keyword || productName.includes(keyword) || keyword.includes(productName)
    );
  });
};

const chooseBestSupplier = (medicine, suppliers) => {
  const matches = suppliers
    .map((supplier) => {
      const catalogItem = getCatalogMatch(supplier, medicine);
      const productMatch = (supplier.products || []).some((product) => {
        const normalizedProduct = normalizeValue(product);
        return getMedicineKeywords(medicine).some((keyword) =>
          normalizedProduct === keyword || normalizedProduct.includes(keyword) || keyword.includes(normalizedProduct)
        );
      });
      const currentSupplierMatch = String(supplier._id) === getMedicineSupplierId(medicine);
      const preferredSupplierMatch = Boolean(supplier.preferredSupplier);

      if (!catalogItem && !productMatch && !currentSupplierMatch && !preferredSupplierMatch) {
        return null;
      }

      const resolvedCatalogItem = catalogItem || {
        productName: medicine.name,
        unitPrice: 0,
        moq: 1,
        leadTime: ''
      };

      return {
        supplier,
        catalogItem: resolvedCatalogItem,
        hasCatalogMatch: Boolean(catalogItem),
        isCurrentSupplier: currentSupplierMatch,
        isPreferredSupplier: preferredSupplierMatch || currentSupplierMatch,
        priceRank: Number(resolvedCatalogItem.unitPrice || 0),
        leadTimeRank: parseLeadTimeDays(resolvedCatalogItem.leadTime)
      };
    })
    .filter(Boolean);

  if (matches.length === 0) {
    return null;
  }

  matches.sort((left, right) => {
    if (left.hasCatalogMatch !== right.hasCatalogMatch) {
      return left.hasCatalogMatch ? -1 : 1;
    }
    if (left.isPreferredSupplier !== right.isPreferredSupplier) {
      return left.isPreferredSupplier ? -1 : 1;
    }
    if (left.isCurrentSupplier !== right.isCurrentSupplier) {
      return left.isCurrentSupplier ? -1 : 1;
    }
    if (left.priceRank !== right.priceRank) {
      return left.priceRank - right.priceRank;
    }
    return left.leadTimeRank - right.leadTimeRank;
  });

  const best = matches[0];
  let recommendationReason = 'Best supplier: lowest price.';

  if (!best.hasCatalogMatch) {
    recommendationReason = 'Best supplier: fallback supplier match used because no detailed catalog price was found.';
  } else if (best.isCurrentSupplier) {
    recommendationReason = 'Best supplier: current supplier for this medicine.';
  } else if (best.isPreferredSupplier) {
    recommendationReason = 'Best supplier: preferred supplier.';
  } else if (Number.isFinite(best.leadTimeRank) && best.leadTimeRank <= 2) {
    recommendationReason = 'Best supplier: fastest delivery.';
  }

  return {
    ...best,
    recommendationReason
  };
};

const calculateRecommendedQuantity = (medicine, catalogItem) => {
  const currentStock = Number(medicine.stockQuantity || 0);
  const reorderLevel = Number(medicine.thresholdValue || 10);
  const targetStock = Math.max(reorderLevel * 2, reorderLevel + 1);
  const neededQuantity = Math.max(targetStock - currentStock, 1);
  const moq = Number(catalogItem?.moq || 1);

  return Math.max(neededQuantity, moq);
};

const normalizeOrderItems = (items = [], fallbackItems = []) => (
  items.map((item, index) => {
    const fallbackItem = fallbackItems[index] || {};
    const recommendedQuantity = Number(
      item.recommendedQuantity ?? item.quantity ?? fallbackItem.recommendedQuantity ?? fallbackItem.quantity ?? 1
    );
    const unitPrice = Number(item.unitPrice ?? fallbackItem.unitPrice ?? 0);
    const normalizedQuantity = Number.isFinite(recommendedQuantity) && recommendedQuantity > 0 ? recommendedQuantity : 1;

    return {
      medicine: item.medicine || fallbackItem.medicine,
      productName: item.productName || fallbackItem.productName,
      currentStock: Number(item.currentStock ?? fallbackItem.currentStock ?? 0),
      reorderLevel: Number(item.reorderLevel ?? fallbackItem.reorderLevel ?? 10),
      recommendedQuantity: normalizedQuantity,
      unitPrice,
      moq: Number(item.moq ?? fallbackItem.moq ?? 1),
      leadTime: item.leadTime ?? fallbackItem.leadTime ?? '',
      lineTotal: unitPrice * normalizedQuantity,
      recommendationReason: item.recommendationReason || fallbackItem.recommendationReason || 'Supplier order item'
    };
  })
);

const generateSuggestedOrders = async () => {
  const today = getToday();
  const medicines = await Medicine.find({
    isActive: true,
    expiryDate: { $gte: today }
  }).populate('supplier', 'name');

  const lowStockMedicines = medicines.filter((medicine) =>
    Number(medicine.stockQuantity || 0) <= Number(medicine.thresholdValue || 10)
  );

  if (lowStockMedicines.length === 0) {
    return [];
  }

  const suppliers = await Supplier.find({ supplyStatus: 'active' });
  const groupedBySupplier = new Map();

  lowStockMedicines.forEach((medicine) => {
    const bestSupplier = chooseBestSupplier(medicine, suppliers);
    if (!bestSupplier) {
      return;
    }

    const recommendedQuantity = calculateRecommendedQuantity(medicine, bestSupplier.catalogItem);
    const supplierId = String(bestSupplier.supplier._id);
    const lineTotal = Number(bestSupplier.catalogItem.unitPrice || 0) * recommendedQuantity;

    if (!groupedBySupplier.has(supplierId)) {
      groupedBySupplier.set(supplierId, {
        supplier: bestSupplier.supplier,
        items: []
      });
    }

    groupedBySupplier.get(supplierId).items.push({
      medicine: medicine._id,
      productName: medicine.name,
      currentStock: Number(medicine.stockQuantity || 0),
      reorderLevel: Number(medicine.thresholdValue || 10),
      recommendedQuantity,
      unitPrice: Number(bestSupplier.catalogItem.unitPrice || 0),
      moq: Number(bestSupplier.catalogItem.moq || 1),
      leadTime: bestSupplier.catalogItem.leadTime || '',
      lineTotal,
      recommendationReason: bestSupplier.recommendationReason
    });
  });

  const suggestedOrders = [];

  for (const { supplier, items } of groupedBySupplier.values()) {
    const medicineIds = items.map((item) => String(item.medicine)).sort();
    const existingTrackedOrder = await SupplierOrder.findOne({
      supplier: supplier._id,
      status: { $in: ['suggested', 'approved', 'sent'] },
      isAutoSuggested: true
    }).sort({ updatedAt: -1 });

    const totalAmount = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const leadTimeDays = items
      .map((item) => parseLeadTimeDays(item.leadTime))
      .filter(Number.isFinite);
    const expectedDeliveryDate = leadTimeDays.length > 0
      ? new Date(Date.now() + Math.min(...leadTimeDays) * 24 * 60 * 60 * 1000)
      : null;

    if (existingTrackedOrder) {
      const existingMedicineIds = existingTrackedOrder.items.map((item) => String(item.medicine)).sort();
      if (JSON.stringify(existingMedicineIds) === JSON.stringify(medicineIds)) {
        if (existingTrackedOrder.status === 'suggested') {
          existingTrackedOrder.items = items;
          existingTrackedOrder.totalAmount = totalAmount;
          existingTrackedOrder.expectedDeliveryDate = expectedDeliveryDate;
          existingTrackedOrder.notes = 'Auto-generated from low stock inventory levels.';
          await existingTrackedOrder.save();
        }

        suggestedOrders.push(existingTrackedOrder);
        continue;
      }
    }

    const order = await SupplierOrder.create({
      orderId: buildOrderId(),
      supplier: supplier._id,
      items,
      status: 'suggested',
      isAutoSuggested: true,
      notes: 'Auto-generated from low stock inventory levels.',
      expectedDeliveryDate,
      totalAmount,
      communicationStatus: 'draft'
    });

    suggestedOrders.push(order);
  }

  return suggestedOrders;
};

exports.getSupplierOrders = async (req, res) => {
  try {
    await generateSuggestedOrders();

    const orders = await SupplierOrder.find()
      .populate('supplier', 'name contact suppliedItems')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createSupplierOrder = async (req, res) => {
  try {
    const { supplier, items = [], notes = '', expectedDeliveryDate, sendNow = false } = req.body;
    const supplierRecord = await Supplier.findById(supplier);

    if (!supplierRecord) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const normalizedItems = normalizeOrderItems(items).map((item) => ({
      ...item,
      recommendationReason: item.recommendationReason || 'Manually created supplier order.'
    }));

    const order = await SupplierOrder.create({
      orderId: buildOrderId(),
      supplier,
      items: normalizedItems,
      status: sendNow ? 'sent' : 'suggested',
      isAutoSuggested: false,
      notes,
      expectedDeliveryDate: expectedDeliveryDate || null,
      totalAmount: normalizedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
      communicationStatus: sendNow ? 'sent' : 'draft',
      approvedAt: sendNow ? new Date() : null,
      approvedBy: sendNow ? req.user?._id || null : null
    });

    res.status(201).json({
      success: true,
      message: sendNow ? 'Manual purchase order placed successfully.' : 'Manual purchase order draft created successfully.',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.approveSupplierOrder = async (req, res) => {
  try {
    const order = await SupplierOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Supplier order not found'
      });
    }

    if (Array.isArray(req.body.items) && req.body.items.length > 0) {
      order.items = normalizeOrderItems(req.body.items, order.items);
      order.totalAmount = order.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    }

    order.status = 'sent';
    order.communicationStatus = 'sent';
    order.approvedAt = new Date();
    order.approvedBy = req.user?._id || null;
    await order.save();

    res.json({
      success: true,
      message: 'Purchase order approved and sent to the supplier.',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSupplierOrderSuggestions = async (req, res) => {
  try {
    const orders = await generateSuggestedOrders();
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
