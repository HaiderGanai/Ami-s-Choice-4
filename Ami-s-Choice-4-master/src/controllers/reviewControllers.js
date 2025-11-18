const { Review } = require("../models");



const addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { rating, comment } = req.body;

        //1. Validating Input
        console.log("rating::", rating) 
        // console.log("rating type::", typeof(rating)) 
        if(!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                status: 'fail',
                message: 'Rating must be between 1 to 5'
            })
        }

        if(!comment || comment.trim() === '') {
            return res.status(400).json({
                status: 'fail',
                message: 'Comment cannot be empty'
            })
        }
        
        //2. Check if profuct exists or not (Optional)

        //3. Check if user has already reviewed this product, one user can do only one comment (Optional)

        //4. create review 
        const review = await Review.create({
            userId,
            productId,
            rating,
            comment
        });

        return res.status(200).json({
            status: 'success',
            message: 'Review added successfully!',
            data: {
                review
            }
        })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: 'fail',
            message: 'Internal Server Error!'
        })
    }
}

const allReviews = async (req, res) => {
    try {
        const {productId} = req.params;
        const reviews = await Review.findAll({ where: { productId }});

        if(!reviews) {
            return res.status(200).json({
                staus: 'success',
                message: 'data fetched!',
                data: {
                    reviews
                }
            })
        }
        res.status(200).json({
                staus: 'success',
                message: 'data fetched!',
                data: {
                    reviews
                }
            })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: 'fail',
            message: 'Internal Server Error!'
        })
    }
}

const deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params;
        
        //1. Check if review exists or not
        const review = await Review.findByPk(reviewId);
        if(!review) {
            return res.status(404).json({
                status: 'fail',
                message: 'Review not found!'
            });
        }

        //2. Check ownership of review
        if(review.userId !== userId) {
            return res.status(403).json({
                status: 'fail',
                message: 'You can only delete your own review!'
            })
        }

        //3. Delete the review
        await review.destroy();

        return res.status(200).json({
            status: 'success',
            message: 'Review Delete Successfully!'
        })
    } catch (error) {
        console.log("error::", error)
        return res.status(500).json({
            status: 'fail',
            message: 'Internal Server Error!'
        })
    }
}

module.exports = { addReview, allReviews, deleteReview };