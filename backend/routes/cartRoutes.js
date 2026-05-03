const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCart,
  getCartSummary,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCart
} = require('../controllers/cartController');

router.get('/summary', protect, authorize('admin', 'pharmacist'), getCartSummary);
router.get('/', protect, authorize('customer'), getCart);
router.post('/add', protect, authorize('customer'), addToCart);
router.put('/item/:itemId', protect, authorize('customer'), updateCartItem);
router.delete('/item/:itemId', protect, authorize('customer'), removeFromCart);
router.delete('/clear', protect, authorize('customer'), clearCart);
router.get('/validate', protect, authorize('customer'), validateCart);

module.exports = router;
