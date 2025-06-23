const { Coupon, CouponUsage } = require("../models");
console.log("I am now inside coupon validator")
const validateCoupon = async (code, userId) => {
    const coupon = await Coupon.findOne({ where: { code } });
    // console.log("Coupon from the db::", coupon);

    if (!coupon) {
        return { valid: false, message: "Invalid Coupon code!" };
    }

    if (!coupon.isActive) {
        return { valid: false, message: "Coupon is not active anymore!" };
    }

    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
        return { valid: false, message: "Coupon has expired!" };
    }

    // 💡 Check if the user has already used it
    const alreadyUsedCoupon = await CouponUsage.findOne({
        where: {
            couponId: coupon.id,
            userId: userId,
        }
    })
    if (alreadyUsedCoupon) {
        return { valid: false, message: "Coupon already used by this user!" };
    }

    return { valid: true, coupon,message: 'Coupon valid!', };
};

module.exports = { validateCoupon };
