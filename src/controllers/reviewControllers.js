const { Review, User } = require("../models");

// Add a new review
const addReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be between 1 and 5',
      });
    }

    // Validate comment
    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: 'Comment cannot be empty',
      });
    }

    // Optional: Check if user has already reviewed this product
    // const existingReview = await Review.findOne({ where: { userId, productId } });
    // if (existingReview) { ... }

    // Create review
    const review = await Review.create({
      userId,
      productId,
      rating,
      comment
    });

    return res.status(201).json({
      status: 'success',
      message: 'Review added successfully!',
      data: review
    });

  } catch (error) {
    console.error("AddReview Error:", error);
    return res.status(500).json({
      status: 'fail',
      message: 'Internal Server Error!'
    });
  }
};

// Get all reviews for a product
const allReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.findAll({
      where: { productId },
      include: [{
        model: User,
        as: 'user', // Make sure this matches your Review->User association alias
        attributes: ['firstName', 'lastName']
      }]
    });

    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No reviews found for this product',
        data: []
      });
    }

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown'
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Reviews fetched successfully!',
      data: formattedReviews
    });

  } catch (error) {
    console.error("AllReviews Error:", error);
    return res.status(500).json({
      status: 'fail',
      message: 'Internal Server Error!'
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Review not found!'
      });
    }

    // Check ownership
    if (review.userId !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only delete your own review!'
      });
    }

    await review.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully!'
    });

  } catch (error) {
    console.error("DeleteReview Error:", error);
    return res.status(500).json({
      status: 'fail',
      message: 'Internal Server Error!'
    });
  }
};

module.exports = { addReview, allReviews, deleteReview };
