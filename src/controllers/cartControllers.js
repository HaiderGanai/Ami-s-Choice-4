const { Cart, Product } = require('../models');
const { validateCoupon } = require("../utils/couponValidator");
const { Op } = require("sequelize");

// ---------------- GET CART ----------------
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'image', 'weight', 'price', 'discountPrice']
        }
      ]
    });

    if (!cartItems || cartItems.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: "Cart is empty for this user!",
        data: {
          cartItems: [],
          subtotal: 0,
          discount: 0,
          totalPayable: 0
        }
      });
    }

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

    // Correct total payable calculation
    const totalPayable = Number(subtotal - totalDiscount).toFixed(2);

    return res.status(200).json({
      status: 'success',
      data: {
        cartItems: formattedCartItems,
        subtotal: subtotal.toFixed(2),
        discount: totalDiscount.toFixed(2),
        totalPayable
      }
    });

  } catch (error) {
    console.error('Cart Fetch Error:', error);
    res.status(500).json({
      status: 'fail',
      message: 'Internal Server Error!'
    });
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

    // Runtime calculations
    const itemPrice = Number(product.discountPrice);
    const unitDiscount = Number(product.price) - itemPrice;
    const itemTotalPrice = itemPrice * cartItem.productQuantity;
    const discount = unitDiscount * cartItem.productQuantity;

    // Cart summary
    const allCartItems = await Cart.findAll({ where: { userId } });
    let totalCartValue = 0;
    let totalCartDiscount = 0;

    for (const item of allCartItems) {
      const prod = await Product.findByPk(item.productId);
      if (!prod) continue;
      const price = Number(prod.discountPrice);
      const discountPerUnit = Number(prod.price) - price;
      totalCartValue += price * item.productQuantity;
      totalCartDiscount += discountPerUnit * item.productQuantity;
    }

    return res.status(200).json({
      status: 'success',
      message: 'Product added to cart!',
      data: {
        productId: cartItem.productId,
        quantity: cartItem.productQuantity,
        itemTotalPrice,
        discount,
      },
      cartSummary: {
        totalValue: totalCartValue,
        totalDiscount: totalCartDiscount,
        totalPayable: totalCartValue
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
    const userId = req.user.id;
    const { couponCode, deliveryFee = 0 } = req.body;

    let couponDiscountPercent = 0;
    let couponMessage = "No coupon applied";

    if (couponCode) {
      const result = await validateCoupon(couponCode, userId);
      if (!result.valid) return res.status(400).json({ status: 'fail', message: result.message });

      const coupon = result.coupon;
      couponDiscountPercent = Number(coupon.discountAmount);
      couponMessage = `Coupon "${couponCode}" applied successfully`;
    }

    const cartItems = await Cart.findAll({ where: { userId }, include: [{ model: Product, as: "product" }] });
    if (!cartItems.length) return res.status(400).json({ status: 'fail', message: "Your cart is empty!" });

    let subtotal = 0;
    let totalProductDiscount = 0;

    for (const item of cartItems) {
      const product = item.product;
      const quantity = item.productQuantity;

      const originalPrice = Number(product.price);
      const discountedPrice = Number(product.discountPrice);
      const unitDiscount = originalPrice - discountedPrice;

      subtotal += discountedPrice * quantity;
      totalProductDiscount += unitDiscount * quantity;
    }

    const couponDiscountAmount = (subtotal * couponDiscountPercent) / 100;
    const finalTotal = subtotal - couponDiscountAmount + Number(deliveryFee);

    return res.status(200).json({
      status: 'success',
      message: couponMessage,
      data: {
        cartItems,
        deliveryFee: Number(deliveryFee),
        CouponDiscount: couponDiscountAmount,
        Discount: totalProductDiscount,
        Subtotal: subtotal,
        Total: finalTotal
      },
    });

  } catch (error) {
    console.error("Cart Preview Error:", error);
    return res.status(500).json({ status: 'fail', message: 'Internal Server Error!' });
  }
};

module.exports = { getCart, addToCart, updateCart, removeCartProduct, deleteCart, cartPreview };
