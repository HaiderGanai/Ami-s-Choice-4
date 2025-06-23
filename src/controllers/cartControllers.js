const { where } = require("sequelize");
const { Cart, Product } = require('../models');
const { validateCoupon } = require("../utils/couponValidator");
const e = require("express");
console.log(`Hello Cart`)
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

    //1. find the user's cart data
    console.log("cart association::",Cart.associations);
    console.log("product association::",Product.associations);


    const cartItems = await Cart.findAll({
    where: { userId },
    include: [{
        model: Product,
        as: 'product', // MUST match alias in association
        attributes: ['id', 'name', 'image', 'price', 'disCountPrice']
    }]
});

    if(!cartItems) {
        return res.status(200).json({
            status: 'success',
            message: "Cart is empty for this user!"
        })
    }

    res.status(200).json({
        status: 'success',
        data: {
            cartItems
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

//1. addToCart, discount is applied on each product

// const addToCart = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { productId, quantity = 1 } = req.body;

//     // 1. Check if product exists
//     const product = await Product.findByPk(productId);
//     if (!product) {
//       return res.status(404).json({
//         status: 'fail',
//         message: 'Product not found!',
//       });
//     }

//     if (!product.isInStock || product.stockQuantity < quantity) {
//       return res.status(400).json({
//         status: 'fail',
//         message: `Only ${product.stockQuantity} item(s) in stock for product: ${product.name}`,
//       });
//     }

//     const itemPrice = product.disCountPrice || product.price;

//     // 2. Check if this product already exists in the user's cart
//     let cartItem = await Cart.findOne({ where: { userId, productId } });

//     if (cartItem) {
//       const newTotalQty = cartItem.productQuantity + quantity;

//       if (newTotalQty > product.stockQuantity) {
//         return res.status(400).json({
//           status: 'fail',
//           message: `Only ${product.stockQuantity - cartItem.productQuantity} more item(s) can be added for product: ${product.name}`,
//         });
//       }

//       cartItem.productQuantity = newTotalQty;
//       cartItem.itemTotalPrice = itemPrice * newTotalQty;
//       cartItem.disCount = (product.price - itemPrice) * newTotalQty;
//       cartItem.subTotal = cartItem.itemTotalPrice - cartItem.disCount;
//       await cartItem.save();
//     } else {
//       const itemTotalPrice = itemPrice * quantity;
//       const discount = (product.price - itemPrice) * quantity;
//       const subTotal = itemTotalPrice - discount;

//       cartItem = await Cart.create({
//         userId,
//         productId,
//         productQuantity: quantity,
//         itemTotalPrice,
//         disCount: discount,
//         subTotal,
//       });
//     }

//     return res.status(200).json({
//       status: 'success',
//       message: 'Product added to cart!',
//       data: cartItem,
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: 'fail',
//       message: 'Something went wrong while adding product to cart!',
//     });
//   }
// };

//2. 
// const addToCart = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { productId, quantity = 1 } = req.body;

//     // 1. Check if product exists
//     const product = await Product.findByPk(productId);
//     if (!product) {
//       return res.status(404).json({
//         status: 'fail',
//         message: 'Product not found!',
//       });
//     }

//     if (!product.isInStock || product.stockQuantity < quantity) {
//       return res.status(400).json({
//         status: 'fail',
//         message: `Only ${product.stockQuantity} item(s) in stock for product: ${product.name}`,
//       });
//     }

//     const itemPrice = product.disCountPrice || product.price;

//     // 2. Check if this product already exists in the user's cart
//     let cartItem = await Cart.findOne({ where: { userId, productId } });

//     if (cartItem) {
//       const newTotalQty = cartItem.productQuantity + quantity;

//       if (newTotalQty > product.stockQuantity) {
//         return res.status(400).json({
//           status: 'fail',
//           message: `Only ${product.stockQuantity - cartItem.productQuantity} more item(s) can be added for product: ${product.name}`,
//         });
//       }

//       cartItem.productQuantity = newTotalQty;
//       cartItem.itemTotalPrice = itemPrice * newTotalQty;
//       cartItem.discount = product.discountPrice * newTotalQty;
//       cartItem.subTotal = cartItem.itemTotalPrice ;
//       await cartItem.save();
//     } else {
//       const itemTotalPrice = itemPrice * quantity;
//       const discount = product.discountPrice * quantity;
//       const subTotal = itemTotalPrice ;

//       cartItem = await Cart.create({
//         userId,
//         productId,
//         productQuantity: quantity,
//         itemTotalPrice,
//         discount: discount,
//         subTotal,
//       });
//     }

//     // 🔁 Fetch all cart items to calculate total cart value
//     const allCartItems = await Cart.findAll({ where: { userId } });

//     let totalCartValue = 0;
//     let totalCartDiscount = 0;
//     let totalCartSubTotal = 0;

//     for (const item of allCartItems) {
//   totalCartValue += Number(item.itemTotalPrice);
//   totalCartDiscount += Number(item.discount);
//   totalCartSubTotal += Number(item.subTotal);
// }

//     console.log("Add to Cart API is hit!")
//     return res.status(200).json({
//       status: 'success',
//       message: 'Product added to cart!',
//       data: cartItem,
//       totalCartValue,
//       Subtotal: totalCartDiscount,
//       Total: totalCartSubTotal,
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: 'fail',
//       message: 'Something went wrong while adding product to cart!',
//     });
//   }
// };


//3. add to cart after updating discount percentage
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // 1. Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found!',
      });
    }

    if (!product.isInStock || product.stockQuantity < quantity) {
      return res.status(400).json({
        status: 'fail',
        message: `Only ${product.stockQuantity} item(s) in stock for product: ${product.name}`,
      });
    }

    // Use discountPrice for calculations (price after discount)
    const itemPrice = Number(product.discountPrice);

    // Calculate per unit discount amount (original price - discount price)
    const unitDiscount = Number(product.price) - itemPrice;

    // 2. Check if this product already exists in the user's cart
    let cartItem = await Cart.findOne({ where: { userId, productId } });

    if (cartItem) {
      const newTotalQty = cartItem.productQuantity + quantity;

      if (newTotalQty > product.stockQuantity) {
        return res.status(400).json({
          status: 'fail',
          message: `Only ${product.stockQuantity - cartItem.productQuantity} more item(s) can be added for product: ${product.name}`,
        });
      }

      cartItem.productQuantity = newTotalQty;
      cartItem.itemTotalPrice = itemPrice * newTotalQty; // total price after discount
      cartItem.discount = unitDiscount * newTotalQty; // total discount amount
      cartItem.subTotal = cartItem.itemTotalPrice; // total payable amount after discount
      await cartItem.save();
    } else {
      const itemTotalPrice = itemPrice * quantity; // total price after discount
      const discount = unitDiscount * quantity;    // total discount amount
      const subTotal = itemTotalPrice;             // total payable amount

      cartItem = await Cart.create({
        userId,
        productId,
        productQuantity: quantity,
        itemTotalPrice,
        discount,
        subTotal,
      });
    }

    // 🔁 Fetch all cart items to calculate total cart value
    const allCartItems = await Cart.findAll({ where: { userId } });

    let totalCartValue = 0;      // sum of itemTotalPrice (after discount)
    let totalCartDiscount = 0;   // sum of discount amounts
    let totalCartSubTotal = 0;   // sum of subTotals (should equal totalCartValue here)

    for (const item of allCartItems) {
      totalCartValue += Number(item.itemTotalPrice);
      totalCartDiscount += Number(item.discount);
      totalCartSubTotal += Number(item.subTotal);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Product added to cart!',
      data: cartItem,
      // totalCartValue,
      // Subtotal: totalCartDiscount,
      Total: totalCartSubTotal,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong while adding product to cart!',
    });
  }
};





const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { action, newQuantity } = req.body;

    const cartItem = await Cart.findOne({ where: { userId, productId } });

    if (!cartItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found in cart',
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found',
      });
    }

    let updatedQuantity = cartItem.productQuantity;

    // Handle action or direct quantity update
    if (newQuantity !== undefined) {
      updatedQuantity = Number(newQuantity);
    } else if (action === 'increase') {
      updatedQuantity += 1;
    } else if (action === 'decrease') {
      updatedQuantity -= 1;
    } else {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid action or newQuantity not provided',
      });
    }

    // Remove from cart if quantity becomes 0 or less
    if (updatedQuantity <= 0) {
      await cartItem.destroy();
      return res.status(200).json({
        status: 'success',
        message: 'Product removed from cart',
      });
    }

    // Check if enough stock is available
    if (updatedQuantity > product.stockQuantity) {
      return res.status(400).json({
        status: 'fail',
        message: `Only ${product.stockQuantity} item(s) in stock for product: ${product.name}`,
      });
    }

    const unitPrice = Number(product.discountPrice); // Final price to user
    const originalPrice = Number(product.price);
    const unitDiscount = originalPrice - unitPrice;

    // Cart item calculations based on discounted price
    const itemTotalPrice = unitPrice * updatedQuantity;
    const discount = unitDiscount * updatedQuantity;
    const subTotal = itemTotalPrice; // Final amount user pays

    // Update the cart item
    cartItem.productQuantity = updatedQuantity;
    cartItem.itemTotalPrice = itemTotalPrice;
    cartItem.discount = discount;
    cartItem.subTotal = subTotal;

    await cartItem.save();

    return res.status(200).json({
      status: 'success',
      message: 'Cart item updated successfully',
      data: cartItem,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong while updating cart item',
    });
  }
};



const removeCartProduct = async (req, res) => {
    try {
        const userId = req.user.id;
    const { productId } = req.params;

    
    //1. check if the product exists in the cart
    const productExists = await Cart.findOne({where: {userId, productId }});
    if(!productExists) {
        return res.status(404).json({
            status: 'fail',
            message: 'Product not found in your cart!'
        })
    }
    await productExists.destroy();
    return res.status(200).json({
        status: 'success',
        message: 'Cart Item successfully removed!'
    })
    } catch (error) {
     return res.status(500).json({
        status: 'fail',
        message: 'Internal Server Error!'
     });   
    }
};

const deleteCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartItems = await Cart.findAll({ where: { userId } });

        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Cart does not exist or is already empty!'
            });
        }

        await Cart.destroy({ where: { userId } });

        return res.status(200).json({
            status: 'success',
            message: 'Cart deleted successfully!'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Internal Server Error!'
        });
    }
};

const cartPreview = async (req, res) => {
  const userId = req.user.id;
  const { couponCode, deliveryFee = 0 } = req.body;

  try {
    let couponDiscountPercent = 0;
    let couponMessage = "No coupon applied";

    // Step 1: Validate coupon if provided
    if (couponCode) {
      console.log("Coupon Code::", couponCode);

      const result = await validateCoupon(couponCode, userId);
      if (!result.valid) {
        return res.status(400).json({
          status: 'fail',
          message: result.message,
        });
      }

      const coupon = result.coupon;
      couponDiscountPercent = Number(coupon.discountAmount); // e.g., 25 means 25%
      couponMessage = `Coupon "${couponCode}" applied successfully`;
    }

    // Step 2: Fetch cart items with products
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Product, as: "product" }],
    });

    if (!cartItems.length) {
      return res.status(400).json({
        status: 'fail',
        message: "Your cart is empty!",
      });
    }

    // Step 3: Recalculate pricing
    let subtotal = 0; // total after product discount
    let totalProductDiscount = 0; // product-level discount

    for (const item of cartItems) {
      const product = item.product;
      const quantity = item.productQuantity;

      const originalPrice = Number(product.price);
      const discountedPrice = Number(product.discountPrice);
      const unitDiscount = originalPrice - discountedPrice;

      subtotal += discountedPrice * quantity;
      totalProductDiscount += unitDiscount * quantity;
    }

    // Step 4: Apply coupon discount on subtotal
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
    return res.status(500).json({
      status: 'fail',
      message: 'Internal Server Error!',
    });
  }
};




module.exports = { getCart, addToCart, updateCart, removeCartProduct, deleteCart, cartPreview };