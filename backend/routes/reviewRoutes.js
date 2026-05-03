const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getMyReviews, createOrUpdateReview } = require('../controllers/reviewController');

router.get('/my-reviews', protect, authorize('customer'), getMyReviews);
router.post('/', protect, authorize('customer'), createOrUpdateReview);

module.exports = router;
