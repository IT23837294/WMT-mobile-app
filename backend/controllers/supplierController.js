const Supplier = require('../models/Supplier');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const SupplierOrder = require('../models/SupplierOrder');
const { sendSupplierApplicationSubmittedEmail, sendSupplierApprovedEmail } = require('../services/emailService');

const normalizeSuppliedItems = (items = [], existingItems = []) => {
  const existingMap = new Map(existingItems.map((item) => [String(item._id), item]));

  return items
    .map((item) => {
      const productName = item.productName?.trim();
      const leadTime = item.leadTime?.trim() || '';
      const unitPrice = Number(item.unitPrice);
      const moq = Number(item.moq);

      if (!productName || !Number.isFinite(unitPrice)) {
        return null;
      }

      const existingItem = item._id ? existingMap.get(String(item._id)) : null;
      const previousPrice = existingItem ? Number(existingItem.unitPrice) : null;
      const priceHistory = existingItem?.priceHistory
        ? existingItem.priceHistory.map((entry) => ({
            unitPrice: Number(entry.unitPrice),
            changedAt: entry.changedAt
          }))
        : [];

      if (!existingItem || previousPrice !== unitPrice) {
        priceHistory.push({
          unitPrice,
          changedAt: new Date()
        });
      }

      return {
        ...(item._id ? { _id: item._id } : {}),
        productName,
        unitPrice,
        moq: Number.isFinite(moq) && moq > 0 ? moq : 1,
        leadTime,
        priceHistory
      };
    })
    .filter(Boolean);
};

const normalizeInvoices = (invoices = [], existingInvoices = []) => {
  const existingMap = new Map(existingInvoices.map((invoice) => [String(invoice._id), invoice]));

  return invoices
    .map((invoice) => {
      const invoiceNo = invoice.invoiceNo?.trim();
      const amount = Number(invoice.amount);
      const amountPaid = Number(invoice.amountPaid || 0);

      if (!invoiceNo || !invoice.invoiceDate || !Number.isFinite(amount)) {
        return null;
      }

      const existingInvoice = invoice._id ? existingMap.get(String(invoice._id)) : null;

      return {
        ...(invoice._id ? { _id: invoice._id } : {}),
        invoiceNo,
        invoiceDate: invoice.invoiceDate,
        amount,
        amountPaid: Number.isFinite(amountPaid) ? amountPaid : 0,
        attachmentUrl: invoice.attachmentUrl?.trim() || existingInvoice?.attachmentUrl || '',
        notes: invoice.notes?.trim() || ''
      };
    })
    .filter(Boolean);
};

const normalizePerformance = (performance = {}) => ({
  onTimeDeliveryRate: Number(performance.onTimeDeliveryRate || 0),
  orderAccuracyRate: Number(performance.orderAccuracyRate || 0),
  qualityIssueCount: Number(performance.qualityIssueCount || 0),
  returnCount: Number(performance.returnCount || 0)
});

const normalizeReturnPolicy = (returnPolicy = {}) => ({
  acceptsDamagedReturns:
    returnPolicy.acceptsDamagedReturns === true || returnPolicy.acceptsDamagedReturns === 'true',
  acceptsExpiredExchanges:
    returnPolicy.acceptsExpiredExchanges === true || returnPolicy.acceptsExpiredExchanges === 'true'
});

const normalizeDeliveryCommitment = (deliveryCommitment = {}) => ({
  deliversOnTime:
    deliveryCommitment.deliversOnTime === true || deliveryCommitment.deliversOnTime === 'true'
});

const buildMonthlyStatements = (supplier) => {
  const grouped = (supplier.invoices || []).reduce((acc, invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate);

    if (Number.isNaN(invoiceDate.getTime())) {
      return acc;
    }

    const month = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[month]) {
      acc[month] = {
        month,
        totalInvoiced: 0,
        totalPaid: 0,
        balance: 0
      };
    }

    acc[month].totalInvoiced += Number(invoice.amount || 0);
    acc[month].totalPaid += Number(invoice.amountPaid || 0);
    acc[month].balance = acc[month].totalInvoiced - acc[month].totalPaid;

    return acc;
  }, {});

  return Object.values(grouped).sort((left, right) => right.month.localeCompare(left.month));
};

const isValidSupplierPhoneNumber = (phone = '') => {
  const normalizedPhone = String(phone || '').trim();

  if (!normalizedPhone) {
    return true;
  }

  return /^\d{10}$/.test(normalizedPhone);
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCurrentSupplierLookup = (user = {}) => {
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();
  const normalizedName = String(user?.name || '').trim();

  return {
    $or: [
      normalizedEmail ? { 'contact.email': normalizedEmail } : null,
      normalizedName ? { name: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i') } : null,
      normalizedName ? { companyName: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i') } : null
    ].filter(Boolean)
  };
};

const findCurrentSupplierByUser = (user) => Supplier.findOne(buildCurrentSupplierLookup(user));

const isStaleRegistrationIndexError = (error) => (
  error?.code === 11000 &&
  String(error.message || '').includes('registrationNumber')
);

const createSupplierWithIndexRecovery = async (supplierData) => {
  try {
    return await Supplier.create(supplierData);
  } catch (error) {
    if (!isStaleRegistrationIndexError(error)) {
      throw error;
    }

    try {
      await Supplier.collection.dropIndex('registrationNumber_1');
    } catch (dropError) {
      if (dropError?.codeName !== 'IndexNotFound') {
        throw dropError;
      }
    }

    return Supplier.create(supplierData);
  }
};

exports.getAllSuppliers = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status) query.supplyStatus = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    const mappedSuppliers = suppliers.map((supplier) => ({
      ...supplier.toObject(),
      monthlyStatements: buildMonthlyStatements(supplier)
    }));

    res.json({
      success: true,
      count: mappedSuppliers.length,
      suppliers: mappedSuppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.submitSupplierApplication = async (req, res) => {
  try {
    const {
      companyName = '',
      name,
      contact = {},
      address = {},
      products = [],
      notes = '',
      deliveryPricePerItem = null,
      suppliedItems = [],
      returnPolicy = {},
      deliveryCommitment = {}
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }

    if (!contact.email?.trim() && !contact.phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least an email address or phone number'
      });
    }

    if (!isValidSupplierPhoneNumber(contact.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must contain exactly 10 digits'
      });
    }

    const duplicateQuery = [];
    if (contact.email?.trim()) {
      duplicateQuery.push({ 'contact.email': contact.email.trim().toLowerCase() });
    }
    if (name?.trim()) {
      duplicateQuery.push({ name: name.trim() });
    }

    if (duplicateQuery.length > 0) {
      const existingSupplier = await Supplier.findOne({ $or: duplicateQuery });
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'A supplier application with this name or email already exists'
        });
      }
    }

    const normalizedSuppliedItems = normalizeSuppliedItems(suppliedItems || []);
    const normalizedProducts = normalizedSuppliedItems.length > 0
      ? normalizedSuppliedItems.map((item) => item.productName)
      : Array.isArray(products)
        ? products.map((product) => product.trim()).filter(Boolean)
        : [];

    const supplier = await createSupplierWithIndexRecovery({
      companyName: companyName.trim(),
      name: name.trim(),
      contact: {
        email: contact.email?.trim()?.toLowerCase() || '',
        phone: contact.phone?.trim() || ''
      },
      address: {
        street: address.street?.trim() || '',
        city: address.city?.trim() || '',
        state: address.state?.trim() || '',
        zipCode: address.zipCode?.trim() || '',
        country: address.country?.trim() || 'Sri Lanka'
      },
      paymentStatus: 'pending',
      supplyStatus: 'inactive',
      products: normalizedProducts,
      deliveryPricePerItem:
        deliveryPricePerItem === '' || deliveryPricePerItem === null || deliveryPricePerItem === undefined
          ? null
          : Number(deliveryPricePerItem),
      suppliedItems: normalizedSuppliedItems,
      returnPolicy: normalizeReturnPolicy(returnPolicy),
      deliveryCommitment: normalizeDeliveryCommitment(deliveryCommitment),
      preferredSupplier: false,
      performance: normalizePerformance(),
      invoices: [],
      notes: [notes.trim(), 'Supplier application submitted from public portal. Pending admin review.']
        .filter(Boolean)
        .join(' ')
    });

    try {
      await sendSupplierApplicationSubmittedEmail(supplier);
    } catch (emailError) {
      console.error('Supplier application email error:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Supplier application submitted successfully. Our team will review it soon.',
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get medicines supplied by this supplier
    const medicines = await Medicine.find({ supplier: supplier._id, isActive: true })
      .select('name category stockQuantity price');

    res.json({
      success: true,
      supplier,
      medicines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCurrentSupplier = async (req, res) => {
  try {
    const supplier = await findCurrentSupplierByUser(req.user);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'No supplier profile is linked to this account yet'
      });
    }

    const [medicines, supplierOrders] = await Promise.all([
      Medicine.find({ supplier: supplier._id })
        .select('name category subCategory stockQuantity thresholdValue price expiryDate isActive supplier')
        .sort({ updatedAt: -1 }),
      SupplierOrder.find({ supplier: supplier._id })
        .populate('approvedBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(8)
    ]);

    const activeMedicines = medicines.filter((medicine) => medicine.isActive);
    const openOrders = supplierOrders.filter((order) => ['suggested', 'approved', 'sent'].includes(order.status));
    const completedOrders = supplierOrders.filter((order) => order.status === 'completed');
    const overdueInvoices = (supplier.invoices || []).filter((invoice) => invoice.paymentStatus !== 'paid');
    const totalOutstanding = (supplier.invoices || []).reduce(
      (sum, invoice) => sum + Math.max(0, Number(invoice.amount || 0) - Number(invoice.amountPaid || 0)),
      0
    );
    const averageCatalogPrice = (supplier.suppliedItems || []).length > 0
      ? Number((
          supplier.suppliedItems.reduce((sum, item) => sum + Number(item.unitPrice || 0), 0) /
          supplier.suppliedItems.length
        ).toFixed(2))
      : 0;

    const monthlyStatements = buildMonthlyStatements(supplier);

    res.json({
      success: true,
      supplier: {
        ...supplier.toObject(),
        monthlyStatements
      },
      medicines,
      orders: supplierOrders,
      stats: {
        totalMedicines: medicines.length,
        activeMedicines: activeMedicines.length,
        catalogItems: supplier.suppliedItems?.length || 0,
        openOrders: openOrders.length,
        completedOrders: completedOrders.length,
        overdueInvoices: overdueInvoices.length,
        outstandingBalance: totalOutstanding,
        averageCatalogPrice
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateCurrentSupplier = async (req, res) => {
  try {
    const supplier = await findCurrentSupplierByUser(req.user);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'No supplier profile is linked to this account yet'
      });
    }

    const {
      companyName,
      contact = {},
      address = {},
      deliveryPricePerItem,
      returnPolicy = {},
      deliveryCommitment = {},
      notes
    } = req.body;

    const nextCompanyName = companyName !== undefined ? String(companyName).trim() : supplier.companyName;
    const nextEmail = contact.email !== undefined
      ? String(contact.email).trim().toLowerCase()
      : String(supplier.contact?.email || '').trim().toLowerCase();
    const nextPhone = contact.phone !== undefined
      ? String(contact.phone).trim()
      : String(supplier.contact?.phone || '').trim();

    if (!nextCompanyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    if (!isValidSupplierPhoneNumber(nextPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must contain exactly 10 digits'
      });
    }

    const normalizedDeliveryPrice = deliveryPricePerItem === '' || deliveryPricePerItem === null || deliveryPricePerItem === undefined
      ? null
      : Number(deliveryPricePerItem);

    if (deliveryPricePerItem !== '' && deliveryPricePerItem !== null && deliveryPricePerItem !== undefined && !Number.isFinite(normalizedDeliveryPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery price must be a valid number'
      });
    }

    supplier.companyName = nextCompanyName;
    supplier.contact = {
      email: nextEmail,
      phone: nextPhone
    };
    supplier.address = {
      street: address.street !== undefined ? String(address.street).trim() : String(supplier.address?.street || '').trim(),
      city: address.city !== undefined ? String(address.city).trim() : String(supplier.address?.city || '').trim(),
      state: address.state !== undefined ? String(address.state).trim() : String(supplier.address?.state || '').trim(),
      zipCode: address.zipCode !== undefined ? String(address.zipCode).trim() : String(supplier.address?.zipCode || '').trim(),
      country: address.country !== undefined ? String(address.country).trim() : String(supplier.address?.country || 'Sri Lanka').trim() || 'Sri Lanka'
    };
    supplier.deliveryPricePerItem = normalizedDeliveryPrice;
    supplier.returnPolicy = normalizeReturnPolicy(returnPolicy);
    supplier.deliveryCommitment = normalizeDeliveryCommitment(deliveryCommitment);
    supplier.notes = notes !== undefined
      ? String(notes).trim()
      : String(supplier.notes || '').trim();

    const user = await User.findById(req.user.id);
    if (user) {
      user.phone = nextPhone;
      user.address = {
        street: supplier.address.street || '',
        city: supplier.address.city || '',
        state: supplier.address.state || '',
        zipCode: supplier.address.zipCode || '',
        country: supplier.address.country || 'Sri Lanka'
      };
      await user.save();
    }

    await supplier.save();

    const monthlyStatements = buildMonthlyStatements(supplier);

    res.json({
      success: true,
      message: 'Supplier details updated successfully',
      supplier: {
        ...supplier.toObject(),
        monthlyStatements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const suppliedItems = normalizeSuppliedItems(req.body.suppliedItems || []);
    const invoices = normalizeInvoices(req.body.invoices || []);
    const performance = normalizePerformance(req.body.performance || {});

    const supplier = await createSupplierWithIndexRecovery({
      ...req.body,
      deliveryPricePerItem:
        req.body.deliveryPricePerItem === '' || req.body.deliveryPricePerItem === null || req.body.deliveryPricePerItem === undefined
          ? null
          : Number(req.body.deliveryPricePerItem),
      returnPolicy: normalizeReturnPolicy(req.body.returnPolicy || {}),
      deliveryCommitment: normalizeDeliveryCommitment(req.body.deliveryCommitment || {}),
      preferredSupplier: req.body.preferredSupplier === true || req.body.preferredSupplier === 'true',
      performance,
      invoices,
      suppliedItems,
      products: suppliedItems.map((item) => item.productName)
    });

    res.status(201).json({
      success: true,
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const existingSupplier = await Supplier.findById(req.params.id);

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const suppliedItems = normalizeSuppliedItems(
      req.body.suppliedItems || [],
      existingSupplier.suppliedItems || []
    );
    const invoices = normalizeInvoices(req.body.invoices || [], existingSupplier.invoices || []);
    const performance = normalizePerformance(req.body.performance || existingSupplier.performance || {});

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        deliveryPricePerItem:
          req.body.deliveryPricePerItem === '' || req.body.deliveryPricePerItem === null || req.body.deliveryPricePerItem === undefined
            ? null
            : Number(req.body.deliveryPricePerItem),
        returnPolicy: normalizeReturnPolicy(req.body.returnPolicy || {}),
        deliveryCommitment: normalizeDeliveryCommitment(req.body.deliveryCommitment || {}),
        preferredSupplier: req.body.preferredSupplier === true || req.body.preferredSupplier === 'true',
        performance,
        invoices,
        suppliedItems,
        products: suppliedItems.map((item) => item.productName)
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleSupplierStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier.supplyStatus = status;
    const notes = String(supplier.notes || '');

    if (status === 'active') {
      if (notes.includes('Pending admin review.')) {
        supplier.notes = notes
          .replace('Pending admin review.', 'Supplier request approved by admin.')
          .trim();
      } else if (!notes.includes('Supplier request approved by admin.')) {
        supplier.notes = [notes, 'Supplier request approved by admin.'].filter(Boolean).join(' ');
      }
    } else if (status === 'suspended') {
      if (notes.includes('Pending admin review.')) {
        supplier.notes = notes
          .replace('Pending admin review.', 'Supplier request rejected by admin.')
          .trim();
      } else if (!notes.includes('Supplier request rejected by admin.')) {
        supplier.notes = [notes, 'Supplier request rejected by admin.'].filter(Boolean).join(' ');
      }
    }

    await supplier.save();

    if (status === 'active') {
      try {
        await sendSupplierApprovedEmail(supplier);
      } catch (emailError) {
        console.error('Supplier approved email error:', emailError.message);
      }
    }

    res.json({
      success: true,
      message:
        status === 'active'
          ? 'Supplier request accepted successfully'
          : status === 'suspended'
            ? 'Supplier request rejected successfully'
            : 'Supplier deactivated successfully',
      supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    // Check if supplier has any medicines
    const medicineCount = await Medicine.countDocuments({ supplier: req.params.id });
    
    if (medicineCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supplier with associated medicines'
      });
    }

    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSupplierStats = async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ supplyStatus: 'active' });
    const inactiveSuppliers = await Supplier.countDocuments({ supplyStatus: 'inactive' });
    
    const paymentStats = await Supplier.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalSuppliers,
        active: activeSuppliers,
        inactive: inactiveSuppliers,
        paymentBreakdown: paymentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
