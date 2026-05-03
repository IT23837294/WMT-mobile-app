const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');
const { getAvailableStockForMedicine } = require('../services/inventoryBatchService');

const enrichCartForResponse = async (cart) => {
  if (!cart) {
    return cart;
  }

  const normalizedItems = await Promise.all(
    (cart.items || []).map(async (item) => {
      const medicine = item.medicine;
      if (!medicine?._id) {
        return {
          ...item.toObject(),
          availableStock: 0,
          itemTotal: Number(item.price || 0) * Number(item.quantity || 0),
          isAvailable: false
        };
      }

      const { availableStock } = await getAvailableStockForMedicine(medicine._id);

      return {
        ...item.toObject(),
        availableStock,
        itemTotal: Number(item.price || 0) * Number(item.quantity || 0),
        isAvailable: medicine.isActive !== false
      };
    })
  );

  return {
    ...cart.toObject(),
    items: normalizedItems
  };
};

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.medicine', 'name category price stockQuantity image requiresPrescription')
      .populate('prescription', 'status image');

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        totalAmount: 0
      });
    }

    const enrichedCart = await enrichCartForResponse(cart);

    res.json({
      success: true,
      cart: enrichedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCartSummary = async (req, res) => {
  try {
    const carts = await Cart.find({ 'items.0': { $exists: true } })
      .populate('user', 'name email')
      .populate('items.medicine', 'name price quantity stockQuantity unit');

    const summaryByMedicine = new Map();
    let totalCartItems = 0;
    let totalReservedQuantity = 0;
    let totalCartValue = 0;

    carts.forEach((cart) => {
      cart.items.forEach((item) => {
        if (!item.medicine) {
          return;
        }

        const medicineId = item.medicine._id.toString();
        const reservedQuantity = Number(item.quantity || 0);
        const itemPrice = Number(item.price || item.medicine.price || 0);
        const stockQuantity = Number(item.medicine.stockQuantity ?? item.medicine.quantity ?? 0);

        totalCartItems += 1;
        totalReservedQuantity += reservedQuantity;
        totalCartValue += itemPrice * reservedQuantity;

        if (!summaryByMedicine.has(medicineId)) {
          summaryByMedicine.set(medicineId, {
            medicineId,
            name: item.medicine.name,
            unit: item.medicine.unit || 'units',
            price: itemPrice,
            stockQuantity,
            reservedQuantity: 0,
            activeCarts: 0
          });
        }

        const existingItem = summaryByMedicine.get(medicineId);
        existingItem.reservedQuantity += reservedQuantity;
        existingItem.stockQuantity = stockQuantity;
        existingItem.price = itemPrice;
        existingItem.activeCarts += 1;
      });
    });

    const medicineSummary = Array.from(summaryByMedicine.values()).sort(
      (a, b) => b.reservedQuantity - a.reservedQuantity
    );

    res.json({
      success: true,
      summary: {
        activeCarts: carts.length,
        totalCartItems,
        totalReservedQuantity,
        totalCartValue,
        medicines: medicineSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { medicineId, quantity = 1 } = req.body;
    const requestedQuantity = Number(quantity);

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: 'Medicine is required'
      });
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Check if medicine exists and has enough stock
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    if (!medicine.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This medicine is no longer available'
      });
    }

    const { availableStock } = await getAvailableStockForMedicine(medicineId);

    if (availableStock < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} units available in valid stock`
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: []
      });
    }

    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(
      item => item.medicine.toString() === medicineId
    );

    if (itemIndex > -1) {
      // Update existing item
      const updatedQuantity = cart.items[itemIndex].quantity + requestedQuantity;

      if (availableStock < updatedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} units available in valid stock`
        });
      }

      cart.items[itemIndex].quantity = updatedQuantity;
      cart.items[itemIndex].price = medicine.price;
      cart.items[itemIndex].addedBy = req.user.id;
    } else {
      // Add new item
      cart.items.push({
        medicine: medicineId,
        quantity: requestedQuantity,
        price: medicine.price,
        addedBy: req.user.id
      });
    }

    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.medicine', 'name category price stockQuantity image requiresPrescription')
      .populate('prescription', 'status image');
    const enrichedCart = await enrichCartForResponse(updatedCart);

    res.json({
      success: true,
      message: 'Medicine added to cart',
      cart: enrichedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check stock availability
    const medicine = await Medicine.findById(cart.items[itemIndex].medicine);
    const { availableStock } = await getAvailableStockForMedicine(cart.items[itemIndex].medicine);

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} units available in valid stock`
      });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.medicine', 'name category price stockQuantity image requiresPrescription')
      .populate('prescription', 'status image');
    const enrichedCart = await enrichCartForResponse(updatedCart);

    res.json({
      success: true,
      message: 'Cart updated',
      cart: enrichedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.medicine', 'name category price stockQuantity image requiresPrescription')
      .populate('prescription', 'status image');
    const enrichedCart = await enrichCartForResponse(updatedCart);

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: enrichedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    cart.prescription = null;
    cart.totalAmount = 0;
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.validateCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.medicine', 'name stockQuantity price isActive');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const issues = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      if (!item.medicine.isActive) {
        issues.push(`${item.medicine.name} is no longer available`);
      } else {
        const { availableStock } = await getAvailableStockForMedicine(item.medicine._id);

        if (availableStock < item.quantity) {
          issues.push(`Only ${availableStock} valid units of ${item.medicine.name} available`);
        } else {
          totalAmount += item.price * item.quantity;
        }
      }
    }

    if (issues.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart validation failed',
        issues
      });
    }

    res.json({
      success: true,
      message: 'Cart is valid',
      totalAmount,
      itemCount: cart.items.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
