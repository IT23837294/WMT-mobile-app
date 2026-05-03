const Review = require('../models/Review');
const Order = require('../models/Order');

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('medicine', 'name category')
      .populate('order', 'orderNumber createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createOrUpdateReview = async (req, res) => {
  try {
    const { orderId, medicineId = null, reviewType, rating, comment = '' } = req.body;

    if (!orderId || !reviewType || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Order, review type, and rating are required'
      });
    }

    if (!['medicine', 'service'].includes(reviewType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review type'
      });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const order = await Order.findById(orderId).populate('items.medicine', '_id name');

    if (!order || String(order.user) !== String(req.user.id)) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (['cancelled', 'rejected'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Cancelled or rejected orders cannot be reviewed'
      });
    }

    let reviewQuery = {
      user: req.user.id,
      order: orderId,
      reviewType
    };

    if (reviewType === 'medicine') {
      if (!medicineId) {
        return res.status(400).json({
          success: false,
          message: 'Medicine is required for medicine ratings'
        });
      }

      const medicineExistsInOrder = order.items.some((item) => String(item.medicine?._id || item.medicine) === String(medicineId));
      if (!medicineExistsInOrder) {
        return res.status(400).json({
          success: false,
          message: 'This medicine does not belong to the selected order'
        });
      }

      reviewQuery = { ...reviewQuery, medicine: medicineId };
    } else {
      reviewQuery = { ...reviewQuery, medicine: null };
    }

    const review = await Review.findOneAndUpdate(
      reviewQuery,
      {
        ...reviewQuery,
        rating: numericRating,
        comment: comment.trim()
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    )
      .populate('medicine', 'name category')
      .populate('order', 'orderNumber createdAt');

    res.status(201).json({
      success: true,
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
