const express = require('express');
const { addReview, allReviews, deleteReview } = require('../controllers/reviewControllers');
const { verifyToken } = require('../middlewares/jwtMiddleware');
const reviewRouter = express.Router();

reviewRouter.post('/reviews/:productId',verifyToken,addReview);
reviewRouter.get('/reviews/:productId',allReviews);
reviewRouter.delete('/reviews/:reviewId',verifyToken,deleteReview);

module.exports = { reviewRouter };

