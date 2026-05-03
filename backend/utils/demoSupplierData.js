const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const SupplierOrder = require('../models/SupplierOrder');

const now = () => new Date();
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const demoMedicines = [
  {
    name: 'Paracetamol 500mg',
    category: 'Tablets',
    subCategory: 'Pain Relief',
    description: 'Demo medicine linked to the supplier account.',
    price: 18,
    costPrice: 12,
    stockQuantity: 250,
    thresholdValue: 50,
    expiryDate: daysFromNow(365),
    manufacturer: 'Demo Pharma',
    requiresPrescription: false,
    dosage: '500mg',
    strength: '500mg',
    batchNo: 'DEMO-001',
    isActive: true
  },
  {
    name: 'Cetirizine 10mg',
    category: 'Tablets',
    subCategory: 'Allergy Relief',
    description: 'Demo allergy relief tablet supplied by the demo account.',
    price: 22,
    costPrice: 15,
    stockQuantity: 180,
    thresholdValue: 40,
    expiryDate: daysFromNow(330),
    manufacturer: 'Demo Pharma',
    requiresPrescription: false,
    dosage: '10mg',
    strength: '10mg',
    batchNo: 'DEMO-002',
    isActive: true
  },
  {
    name: 'Amoxicillin 250mg',
    category: 'Capsules',
    subCategory: 'Antibiotic',
    description: 'Demo antibiotic capsule linked to the supplier dashboard.',
    price: 35,
    costPrice: 25,
    stockQuantity: 140,
    thresholdValue: 30,
    expiryDate: daysFromNow(420),
    manufacturer: 'Demo Pharma',
    requiresPrescription: true,
    dosage: '250mg',
    strength: '250mg',
    batchNo: 'DEMO-003',
    isActive: true
  },
  {
    name: 'Vitamin C 500mg',
    category: 'Tablets',
    subCategory: 'Supplement',
    description: 'Demo vitamin supplement sold by the supplier account.',
    price: 12,
    costPrice: 8,
    stockQuantity: 300,
    thresholdValue: 60,
    expiryDate: daysFromNow(500),
    manufacturer: 'Demo Pharma',
    requiresPrescription: false,
    dosage: '500mg',
    strength: '500mg',
    batchNo: 'DEMO-004',
    isActive: true
  }
];

const demoInvoices = [
  {
    invoiceNo: 'INV-1001',
    invoiceDate: daysAgo(70),
    amount: 12500,
    amountPaid: 12500,
    attachmentUrl: '',
    notes: 'Closed demo invoice for supplier account'
  },
  {
    invoiceNo: 'INV-1002',
    invoiceDate: daysAgo(35),
    amount: 9800,
    amountPaid: 4800,
    attachmentUrl: '',
    notes: 'Partially paid demo invoice'
  },
  {
    invoiceNo: 'INV-1003',
    invoiceDate: daysAgo(5),
    amount: 7200,
    amountPaid: 0,
    attachmentUrl: '',
    notes: 'Open demo invoice pending payment'
  }
];

const buildSupplierPayload = (medicineDocs) => ({
  companyName: 'Demo Supplier Ltd.',
  name: 'Supplier User',
  contact: {
    email: 'supplier@example.com',
    phone: '0771234567'
  },
  address: {
    street: '12 Supplier Lane',
    city: 'Colombo',
    state: 'Western',
    zipCode: '10100',
    country: 'Sri Lanka'
  },
  paymentStatus: 'pending',
  supplyStatus: 'active',
  products: medicineDocs.map((medicine) => medicine.name),
  deliveryPricePerItem: 25,
  suppliedItems: medicineDocs.map((medicine) => {
    const prices = {
      'Paracetamol 500mg': { unitPrice: 15, moq: 100, leadTime: '2-3 days' },
      'Cetirizine 10mg': { unitPrice: 22, moq: 80, leadTime: '3-4 days' },
      'Amoxicillin 250mg': { unitPrice: 35, moq: 60, leadTime: '4-5 days' },
      'Vitamin C 500mg': { unitPrice: 12, moq: 120, leadTime: '2 days' }
    };

    return {
      productName: medicine.name,
      ...prices[medicine.name]
    };
  }),
  returnPolicy: {
    acceptsDamagedReturns: true,
    acceptsExpiredExchanges: true
  },
  deliveryCommitment: {
    deliversOnTime: true
  },
  preferredSupplier: true,
  performance: {
    onTimeDeliveryRate: 97,
    orderAccuracyRate: 95,
    qualityIssueCount: 1,
    returnCount: 0
  },
  invoices: demoInvoices,
  notes: 'Seeded supplier demo profile with catalog, invoices, and purchase orders.'
});

const buildDemoOrders = (supplierId, medicineDocs, userId) => [
  {
    orderId: 'PO-DEMO-1001',
    supplier: supplierId,
    items: [
      {
        medicine: medicineDocs.find((medicine) => medicine.name === 'Paracetamol 500mg')?._id,
        productName: 'Paracetamol 500mg',
        currentStock: 250,
        reorderLevel: 50,
        recommendedQuantity: 100,
        unitPrice: 15,
        moq: 100,
        leadTime: '2-3 days',
        lineTotal: 1500,
        recommendationReason: 'Demo purchase order for supplier dashboard'
      },
      {
        medicine: medicineDocs.find((medicine) => medicine.name === 'Cetirizine 10mg')?._id,
        productName: 'Cetirizine 10mg',
        currentStock: 180,
        reorderLevel: 40,
        recommendedQuantity: 80,
        unitPrice: 22,
        moq: 80,
        leadTime: '3-4 days',
        lineTotal: 1760,
        recommendationReason: 'Demo order to cover seasonal demand'
      }
    ],
    status: 'sent',
    isAutoSuggested: false,
    notes: 'Seeded demo purchase order for the supplier dashboard.',
    expectedDeliveryDate: daysFromNow(3),
    totalAmount: 3260,
    approvedAt: now(),
    approvedBy: userId,
    communicationStatus: 'sent'
  },
  {
    orderId: 'PO-DEMO-1002',
    supplier: supplierId,
    items: [
      {
        medicine: medicineDocs.find((medicine) => medicine.name === 'Amoxicillin 250mg')?._id,
        productName: 'Amoxicillin 250mg',
        currentStock: 140,
        reorderLevel: 30,
        recommendedQuantity: 60,
        unitPrice: 35,
        moq: 60,
        leadTime: '4-5 days',
        lineTotal: 2100,
        recommendationReason: 'Replenishment for antibiotic shelf availability'
      },
      {
        medicine: medicineDocs.find((medicine) => medicine.name === 'Vitamin C 500mg')?._id,
        productName: 'Vitamin C 500mg',
        currentStock: 300,
        reorderLevel: 60,
        recommendedQuantity: 120,
        unitPrice: 12,
        moq: 120,
        leadTime: '2 days',
        lineTotal: 1440,
        recommendationReason: 'Demo order for supplement stock rotation'
      }
    ],
    status: 'approved',
    isAutoSuggested: false,
    notes: 'Approved demo purchase order.',
    expectedDeliveryDate: daysFromNow(5),
    totalAmount: 3540,
    approvedAt: daysAgo(1),
    approvedBy: userId,
    communicationStatus: 'sent'
  },
  {
    orderId: 'PO-DEMO-1003',
    supplier: supplierId,
    items: [
      {
        medicine: medicineDocs.find((medicine) => medicine.name === 'Paracetamol 500mg')?._id,
        productName: 'Paracetamol 500mg',
        currentStock: 250,
        reorderLevel: 50,
        recommendedQuantity: 50,
        unitPrice: 15,
        moq: 100,
        leadTime: '2-3 days',
        lineTotal: 750,
        recommendationReason: 'Completed demo replenishment'
      },
      {
        medicine: medicineDocs.find((medicine) => medicine.name === 'Amoxicillin 250mg')?._id,
        productName: 'Amoxicillin 250mg',
        currentStock: 140,
        reorderLevel: 30,
        recommendedQuantity: 30,
        unitPrice: 35,
        moq: 60,
        leadTime: '4-5 days',
        lineTotal: 1050,
        recommendationReason: 'Completed demo replenishment'
      }
    ],
    status: 'completed',
    isAutoSuggested: false,
    notes: 'Completed demo purchase order.',
    expectedDeliveryDate: daysAgo(2),
    totalAmount: 1800,
    approvedAt: daysAgo(10),
    approvedBy: userId,
    communicationStatus: 'sent'
  }
];

const ensureDemoSupplierData = async (user) => {
  if (!user || user.role !== 'supplier') {
    return null;
  }

  let supplierProfile = await Supplier.findOne({ 'contact.email': 'supplier@example.com' });

  if (!supplierProfile) {
    supplierProfile = await Supplier.create({
      companyName: 'Demo Supplier Ltd.',
      name: 'Supplier User',
      contact: {
        email: 'supplier@example.com',
        phone: '0771234567'
      },
      address: {
        street: '12 Supplier Lane',
        city: 'Colombo',
        state: 'Western',
        zipCode: '10100',
        country: 'Sri Lanka'
      },
      paymentStatus: 'pending',
      supplyStatus: 'active',
      notes: 'Seeded supplier demo profile.'
    });
  } else {
    supplierProfile.companyName = supplierProfile.companyName || 'Demo Supplier Ltd.';
    supplierProfile.name = supplierProfile.name || 'Supplier User';
    supplierProfile.contact = {
      email: 'supplier@example.com',
      phone: supplierProfile.contact?.phone || '0771234567'
    };
    supplierProfile.address = {
      street: supplierProfile.address?.street || '12 Supplier Lane',
      city: supplierProfile.address?.city || 'Colombo',
      state: supplierProfile.address?.state || 'Western',
      zipCode: supplierProfile.address?.zipCode || '10100',
      country: supplierProfile.address?.country || 'Sri Lanka'
    };
    supplierProfile.paymentStatus = supplierProfile.paymentStatus || 'pending';
    supplierProfile.supplyStatus = supplierProfile.supplyStatus || 'active';
    supplierProfile.notes = supplierProfile.notes || 'Seeded supplier demo profile.';
  }

  const medicineDocs = [];
  for (const medicineData of demoMedicines) {
    const medicine = await Medicine.findOneAndUpdate(
      { name: medicineData.name },
      { $set: { ...medicineData, supplier: supplierProfile._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    medicineDocs.push(medicine);
  }

  for (const medicine of medicineDocs) {
    medicine.supplier = supplierProfile._id;
    await medicine.save();
  }

  const supplierPayload = buildSupplierPayload(medicineDocs);
  supplierProfile.set(supplierPayload);
  await supplierProfile.save();

  for (const orderData of buildDemoOrders(supplierProfile._id, medicineDocs, user._id)) {
    await SupplierOrder.findOneAndUpdate(
      { orderId: orderData.orderId },
      { $set: orderData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  return {
    supplierProfile,
    medicines: medicineDocs
  };
};

module.exports = {
  ensureDemoSupplierData
};
