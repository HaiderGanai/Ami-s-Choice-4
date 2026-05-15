const { Cart, Product } = require('../models');
const { validateCoupon } = require("../utils/couponValidator");
const { Op } = require("sequelize");
const { sequelize } = require('../config/dbConnect');

// ---------------- GET CART ----------------
const getCart = async (req, res) => {
  try {
    const { items, totals } = await getCartWithTotals(req.user.id);

    if (!items.length) {
      return res.status(200).json({
        status: 'success',
        message: 'Cart is empty for this user!',
        data: { cartItems: [], subtotal: '0.00', discount: '0.00', totalPayable: '0.00' },
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        cartItems: items,
        subtotal: totals.originalSubtotal.toFixed(2),
        discount: totals.productDiscount.toFixed(2),
        totalPayable: totals.payableBeforeCoupon.toFixed(2),
      },
    });
  } catch (err) {
    console.error('Cart Fetch Error:', err);
    res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};


// ---------------- ADD TO CART ----------------
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // Fetch product
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found!' });
    }

    if (!product.isInStock || product.stockQuantity < quantity) {
      return res.status(400).json({
        status: 'fail',
        message: `Only ${product.stockQuantity} item(s) in stock for product: ${product.name}`,
      });
    }

    // Check if already in cart
    let cartItem = await Cart.findOne({ where: { userId, productId } });

    if (cartItem) {
      const newTotalQty = cartItem.productQuantity + quantity;
      if (newTotalQty > product.stockQuantity) {
        return res.status(400).json({
          status: 'fail',
          message: `Only ${product.stockQuantity - cartItem.productQuantity} more item(s) can be added`,
        });
      }
      cartItem.productQuantity = newTotalQty;
      await cartItem.save();
    } else {
      cartItem = await Cart.create({ userId, productId, productQuantity: quantity });
    }

    const { items, totals } = await getCartWithTotals(userId);
    const addedItem = items.find(i => i.productId === productId);

    return res.status(200).json({
      status: 'success',
      message: 'Product added to cart!',
      data: {
        productId: cartItem.productId,
        quantity: cartItem.productQuantity,
        itemTotalPrice: addedItem ? Number(addedItem.itemTotalPrice) : 0,
        discount: addedItem
          ? (Number(addedItem.originalPricePerUnit) - Number(addedItem.discountPricePerUnit)) * cartItem.productQuantity
          : 0,
      },
      cartSummary: {
        totalValue: totals.originalSubtotal.toFixed(2),
        totalDiscount: totals.productDiscount.toFixed(2),
        totalPayable: totals.payableBeforeCoupon.toFixed(2),
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong while adding product to cart!',
    });
  }
};

// ---------------- UPDATE CART ----------------
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { action, newQuantity } = req.body;

    const cartItem = await Cart.findOne({ where: { userId, productId } });
    if (!cartItem) return res.status(404).json({ status: 'fail', message: 'Product not found in cart' });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });

    let updatedQuantity = cartItem.productQuantity;
    if (newQuantity !== undefined) updatedQuantity = Number(newQuantity);
    else if (action === 'increase') updatedQuantity += 1;
    else if (action === 'decrease') updatedQuantity -= 1;
    else return res.status(400).json({ status: 'fail', message: 'Invalid action or newQuantity not provided' });

    if (updatedQuantity <= 0) {
      await cartItem.destroy();
      return res.status(200).json({ status: 'success', message: 'Product removed from cart' });
    }

    if (updatedQuantity > product.stockQuantity) {
      return res.status(400).json({
        status: 'fail',
        message: `Only ${product.stockQuantity} item(s) in stock for product: ${product.name}`,
      });
    }

    cartItem.productQuantity = updatedQuantity;
    await cartItem.save();

    const unitPrice = Number(product.discountPrice);
    const unitDiscount = Number(product.price) - unitPrice;
    const itemTotalPrice = unitPrice * updatedQuantity;
    const discount = unitDiscount * updatedQuantity;

    return res.status(200).json({
      status: 'success',
      message: 'Cart item updated successfully',
      data: { productId: cartItem.productId, quantity: updatedQuantity, itemTotalPrice, discount, subTotal: itemTotalPrice },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'fail', message: 'Something went wrong while updating cart item' });
  }
};

// ---------------- REMOVE SINGLE PRODUCT ----------------
const removeCartProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const productExists = await Cart.findOne({ where: { userId, productId } });
    if (!productExists) return res.status(404).json({ status: 'fail', message: 'Product not found in your cart!' });

    await productExists.destroy();
    return res.status(200).json({ status: 'success', message: 'Cart Item successfully removed!' });

  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};

// ---------------- DELETE ENTIRE CART ----------------
const deleteCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await Cart.findAll({ where: { userId } });

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ status: 'fail', message: 'Cart does not exist or is already empty!' });
    }

    await Cart.destroy({ where: { userId } });
    return res.status(200).json({ status: 'success', message: 'Cart deleted successfully!' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};

// ---------------- CART PREVIEW WITH COUPON ----------------
const cartPreview = async (req, res) => {
  try {
    const { couponCode, deliveryFee = 0 } = req.body;
    const { items, totals } = await getCartWithTotals(req.user.id);

    if (!items.length) {
      return res.status(400).json({ status: 'fail', message: 'Your cart is empty!' });
    }

    let couponDiscountPercent = 0;
    let couponDiscountAmount = 0;
    let couponMessage = 'No coupon applied';

    if (couponCode) {
      const result = await validateCoupon(couponCode, req.user.id);
      if (!result.valid) {
        return res.status(400).json({ status: 'fail', message: result.message });
      }
      couponDiscountPercent = Number(result.coupon.discountAmount);
      couponDiscountAmount = (totals.payableBeforeCoupon * couponDiscountPercent) / 100;
      couponMessage = `Coupon "${couponCode}" applied successfully`;
    }

    const finalTotal = totals.payableBeforeCoupon - couponDiscountAmount + Number(deliveryFee);

    return res.status(200).json({
      status: 'success',
      message: couponMessage,
      data: {
        cartItems: items,
        subtotal: Number(totals.originalSubtotal.toFixed(2)),
        discount: Number(totals.productDiscount.toFixed(2)),
        couponDiscount: Number(couponDiscountAmount.toFixed(2)),
        deliveryFee: Number(deliveryFee),
        total: Number(finalTotal.toFixed(2)),
      },
    });
  } catch (err) {
    console.error('Cart Preview Error:', err);
    return res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};

// ---------------- BULK ADD TO CART (guest cart sync) ----------------
const bulkAddToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Request body must be a non-empty array of { productId, quantity }'
      });
    }

    const skipped = [];

    await sequelize.transaction(async (t) => {
      for (const entry of items) {
        const { productId, productQuantity } = entry;
        const qty = Number(productQuantity);

        if (!productId || !qty || qty < 1) {
          skipped.push({ productId, reason: 'Invalid productId or quantity' });
          continue;
        }

        const product = await Product.findByPk(productId, { transaction: t });
        if (!product) {
          skipped.push({ productId, reason: 'Product not found' });
          continue;
        }

        if (!product.isInStock || product.stockQuantity < 1) {
          skipped.push({ productId, productName: product.name, reason: 'Out of stock' });
          continue;
        }

        const existingItem = await Cart.findOne({ where: { userId, productId }, transaction: t });

        if (existingItem) {
          const newQty = Math.min(existingItem.productQuantity + qty, product.stockQuantity);
          existingItem.productQuantity = newQty;
          await existingItem.save({ transaction: t });
        } else {
          const cappedQty = Math.min(qty, product.stockQuantity);
          await Cart.create({ userId, productId, productQuantity: cappedQty }, { transaction: t });
        }
      }
    });

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'image', 'weight', 'price', 'discountPrice'] }]
    });

    let subtotal = 0;
    let totalDiscount = 0;

    const formattedCartItems = cartItems.map(item => {
      const { id: cartItemId, productQuantity } = item;
      const { id: productId, name, image, weight, price, discountPrice } = item.product;

      const totalOriginalPrice = Number(price) * productQuantity;
      const totalDiscountedPrice = Number(discountPrice) * productQuantity;
      const itemDiscount = totalOriginalPrice - totalDiscountedPrice;

      subtotal += totalDiscountedPrice;
      totalDiscount += itemDiscount;

      return {
        id: cartItemId,
        productId,
        productName: name,
        productImage: image,
        productWeight: weight,
        productQuantity,
        itemTotalPrice: totalDiscountedPrice.toFixed(2),
        originalPricePerUnit: price,
        discountPricePerUnit: discountPrice
      };
    });

    const skippedCount = skipped.length;
    const message = skippedCount > 0
      ? `Cart synced. ${skippedCount} item(s) could not be added.`
      : 'Cart synced successfully.';

    return res.status(200).json({
      status: 'success',
      message,
      data: {
        cartItems: formattedCartItems,
        subtotal: subtotal.toFixed(2),
        discount: totalDiscount.toFixed(2),
        totalPayable: (subtotal - totalDiscount).toFixed(2)
      },
      ...(skippedCount > 0 && { skipped })
    });

  } catch (error) {
    console.error('Bulk Add To Cart Error:', error);
    return res.status(500).json({ status: 'fail', message: 'Something went wrong during cart sync!' });
  }
};

// services/cart.service.js
async function getCartWithTotals(userId) {
  const cartItems = await Cart.findAll({
    where: { userId },
    include: [{
      model: Product,
      as: 'product',
      attributes: ['id', 'name', 'image', 'weight', 'price', 'discountPrice'],
    }],
  });

  let originalSubtotal = 0;
  let productDiscount = 0;

  const items = cartItems.map(item => {
    const { id: cartItemId, productQuantity } = item;
    const { id: productId, name, image, weight, price, discountPrice } = item.product;

    const lineOriginal = Number(price) * productQuantity;
    const lineDiscounted = Number(discountPrice) * productQuantity;

    originalSubtotal += lineOriginal;
    productDiscount += lineOriginal - lineDiscounted;

    return {
      id: cartItemId,
      productId,
      productName: name,
      productImage: image,
      productWeight: weight,
      productQuantity,
      itemTotalPrice: lineDiscounted.toFixed(2),
      originalPricePerUnit: price,
      discountPricePerUnit: discountPrice,
    };
  });

  return {
    items,
    totals: {
      originalSubtotal,
      productDiscount,
      payableBeforeCoupon: originalSubtotal - productDiscount,
    },
  };
}

module.exports = { getCart, addToCart, updateCart, removeCartProduct, deleteCart, cartPreview, bulkAddToCart };
