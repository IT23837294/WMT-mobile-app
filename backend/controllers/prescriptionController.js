const Prescription = require('../models/Prescription');
const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');
const fs = require('fs');
const path = require('path');

exports.uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a prescription image'
      });
    }

    const prescription = await Prescription.create({
      user: req.user.id,
      image: `/uploads/${req.file.filename}`,
      publicId: req.file.filename,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded successfully',
      prescription
    });
  } catch (error) {
    // Clean up uploaded file if error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ user: req.user.id })
      .populate('items.medicine', 'name category price')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllPrescriptions = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) query.status = status;

    const prescriptions = await Prescription.find(query)
      .populate('user', 'name email phone')
      .populate('items.medicine', 'name category price')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('items.medicine', 'name category price stockQuantity expiryDate batchNo dosage strength manufacturer')
      .populate('reviewedBy', 'name');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.reviewPrescription = async (req, res) => {
  try {
    const { items, notes, deliveryCharge, discount } = req.body;
    
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one medicine'
      });
    }

    const medicineIds = items.map((item) => item.medicineId);
    const medicines = await Medicine.find({ _id: { $in: medicineIds }, isActive: true });
    const medicineMap = new Map(medicines.map((medicine) => [String(medicine._id), medicine]));

    const unavailableItems = [];
    let totalAmount = 0;
    let hasPartialApproval = false;

    const prescriptionItems = items.map(item => {
      const medicine = medicineMap.get(String(item.medicineId));

      if (!medicine) {
        unavailableItems.push(item.name || 'Unknown medicine');
        return null;
      }

      const requestedQuantity = Number(item.quantity || 0);
      const availableQuantity = Number(medicine.stockQuantity || 0);
      const approvedQuantity = Math.min(requestedQuantity, availableQuantity);

      if (approvedQuantity <= 0) {
        unavailableItems.push(medicine.name);
        return {
          medicine: item.medicineId,
          quantity: 0,
          requestedQuantity,
          price: Number(item.price || medicine.price || 0),
          notes: item.notes || '',
          fulfillmentStatus: 'unavailable',
          allocatedBatchNo: medicine.batchNo || '',
          allocatedExpiryDate: medicine.expiryDate || null
        };
      }

      if (approvedQuantity < requestedQuantity) {
        hasPartialApproval = true;
      }

      const itemPrice = Number(item.price || medicine.price || 0);
      const itemTotal = itemPrice * approvedQuantity;
      totalAmount += itemTotal;

      return {
        medicine: item.medicineId,
        quantity: approvedQuantity,
        requestedQuantity,
        price: itemPrice,
        notes: item.notes || '',
        fulfillmentStatus: approvedQuantity < requestedQuantity ? 'partial' : 'approved',
        allocatedBatchNo: medicine.batchNo || '',
        allocatedExpiryDate: medicine.expiryDate || null
      };
    }).filter(Boolean);

    const approvedItems = prescriptionItems.filter((item) => item.quantity > 0);

    if (approvedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: unavailableItems.length > 0
          ? `No stock available for: ${unavailableItems.join(', ')}`
          : 'No medicines could be approved'
      });
    }

    const finalAmount = totalAmount + (deliveryCharge || 50) - (discount || 0);

    prescription.items = prescriptionItems;
    prescription.notes = notes;
    prescription.rejectionReason = '';
    prescription.totalAmount = totalAmount;
    prescription.deliveryCharge = deliveryCharge || 50;
    prescription.discount = discount || 0;
    prescription.finalAmount = finalAmount;
    prescription.status = 'reviewed';
    prescription.reviewOutcome = hasPartialApproval || unavailableItems.length > 0 ? 'partial' : 'approved';
    prescription.reviewedBy = req.user.id;
    prescription.reviewedAt = new Date();

    await prescription.save();

    // Create or update cart for the customer
    let cart = await Cart.findOne({ user: prescription.user });
    
    if (!cart) {
      cart = await Cart.create({
        user: prescription.user,
        items: [],
        prescription: prescription._id
      });
    } else {
      cart.prescription = prescription._id;
      cart.items = [];
    }

    // Add items to cart
    for (const item of approvedItems) {
      cart.items.push({
        medicine: item.medicine,
        quantity: item.quantity,
        price: item.price,
        addedBy: req.user.id
      });
    }

    await cart.save();

    res.json({
      success: true,
      message: hasPartialApproval || unavailableItems.length > 0
        ? 'Prescription partially approved with available items added to customer cart'
        : 'Prescription approved and items added to customer cart',
      prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.rejectPrescription = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason,
        notes: reason,
        reviewOutcome: 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      message: 'Prescription rejected',
      prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
