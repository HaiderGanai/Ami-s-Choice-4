const { Coupon } = require("../models");



const createCoupon = async (req, res) => {
    try {
        
        const { couponCode, discountAmount, expiresAt, isActive } = req.body;
        if(!couponCode || !discountAmount || !expiresAt || isActive === undefined) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please Enter All fields!'
            });
        }
        const codeExists = await Coupon.findOne({ where: { couponCode }});
        if(codeExists) {
            return res.status(409).json({
                status: 'fail',
                message: 'Another coupon with same code already exists!'
            });
        }

        if(new Date(expiresAt).getTime() <= Date.now()) {
            return res.status(422).json({
                status: 'fail',
                message: 'Coupons cannot have a previous date or time!'
            });
        }
        const coupon = await Coupon.create({
            code: couponCode,
            discountAmount,
            expiresAt,
            isActive,
        });

        return res.status(201).json({
            status: 'success',
            message: 'Coupon created Successfully!',
            data: {
                coupon
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: 'Internal Server Error!'
        })
    }
}

const listCoupon = async (req, res) => {
    try {
        const userId = req.user.id;

        const coupons = await Coupon.findAll();

        if (coupons.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No coupons found!',
                data: {
                    coupons: []
                }
            });
        }

        return res.status(200).json({
            status: 'success',
            data: {
                coupons
            }
        });
    } catch (error) {
        console.error('Error listing coupons:', error);
        return res.status(500).json({
            status: 'fail',
            message: 'Internal Server Error!'
        });
    }
}

const updateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const { couponCode, discountAmount, expiresAt, isActive } = req.body;

    if (!code) {
      return res.status(400).json({
        status: 'fail',
        message: 'Coupon ID is required in URL params.'
      });
    }

    const coupon = await Coupon.findOne({ where: { code }});

    if (!coupon) {
      return res.status(404).json({
        status: 'fail',
        message: `Coupon with ID "${code}" not found.`
      });
    }

    // Update only provided fields
    const updatedFields = {};

    if (couponCode !== undefined) updatedFields.code = couponCode;
    if (discountAmount !== undefined) {
      const numericDiscount = parseFloat(discountAmount);
      if (isNaN(numericDiscount) || numericDiscount < 0 || numericDiscount > 100) {
        return res.status(400).json({
          status: 'fail',
          message: 'discountAmount must be a number between 0 and 100'
        });
      }
      updatedFields.discountAmount = numericDiscount;
    }
    if (expiresAt !== undefined) updatedFields.expiresAt = expiresAt;
    if (isActive !== undefined) updatedFields.isActive = isActive;

    await coupon.update(updatedFields);

    return res.status(200).json({
      status: 'success',
      message: 'Coupon updated successfully!',
      data: { coupon }
    });

  } catch (error) {
    console.error('Error updating coupon:', error);
    return res.status(500).json({
      status: 'fail',
      message: 'Internal Server Error!'
    });
  }
};



module.exports = { createCoupon, listCoupon, updateCoupon };