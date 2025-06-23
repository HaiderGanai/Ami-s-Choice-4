const { sequelize } = require("../config/dbConnect");
const { Cart, Product, Order, CouponUsage } = require("../models");
const { validateCoupon } = require("../utils/couponValidator");


//1.
// const checkOut = async (req, res) => {
//   const userId = req.user.id;
//   const { couponCode } = req.body;

//   const t = await sequelize.transaction();

//   try {
//     let discountAmount = 0;

//     // 1. Validating coupon
//     if (couponCode) {
//       const { valid, message, coupon } = await validateCoupon(couponCode, userId);

//       if (!valid) {
//         await t.rollback();
//         return res.status(400).json({
//           status: "fail",
//           message,
//         });
//       }

//       discountAmount = coupon.discountAmount;

//       // Mark coupon as used
//       await CouponUsage.create({
//         couponId: coupon.id,
//         userId: userId,
//       }, { transaction: t });
//     }

//     // 2. Fetch cart items
//     const cartItems = await Cart.findAll({
//       where: { userId },
//       include: [{ model: Product, as: "product" }],
//       transaction: t,
//       lock: true // to prevent race condition on stock update
//     });

//     // 3. Check if cart is empty
//     if (!cartItems || cartItems.length === 0) {
//       await t.rollback();
//       return res.status(400).json({
//         status: "fail",
//         message: "Your Cart is empty!",
//       });
//     }

//     const deliveryFee = 200;
//     let ordersToCreate = [];
//     let totalProductAmount = 0;
//     const orderNumber = Math.floor(10000 + Math.random() * 90000); // 5-digit number

//     // 4. Create order items and update stock
//     for (const item of cartItems) {
//       const product = item.product;
//       const quantity = item.productQuantity;

//       if (product.stockQuantity < quantity) {
//         await t.rollback();
//         return res.status(400).json({
//           status: "fail",
//           message: `Insufficient stock for product: ${product.name}`,
//         });
//       }

//       const itemTotal = product.price * quantity;
//       totalProductAmount += itemTotal;

//       // Prepare order data
//       ordersToCreate.push({
//         userId,
//         productId: product.id,
//         productQuantity: quantity,
//         itemTotalPrice: itemTotal,
//         orderNumber,
//         discount,
//         totalAmount: itemTotal,
//         status: "pending",
//         deliveryAddress: req.body.deliveryAddress,
//         deliveryFee,
//       });

//       // 5. Update stock
//       const newStock = product.stockQuantity - quantity;
//       await product.update({
//         stockQuantity: newStock,
//         isInStock: newStock > 0
//       }, { transaction: t });
//     }

//     // 6. Apply coupon discount
//     const Total = totalProductAmount - discountAmount + deliveryFee;

//     // 7. Create order
//     const createdOrder = await Order.bulkCreate(ordersToCreate, { transaction: t });

//     // 8. Clear cart
//     await Cart.destroy({ where: { userId }, transaction: t });

//     // 9. Commit transaction
//     await t.commit();

//     // 10. Respond
//     return res.status(201).json({
//       status: "success",
//       message: "Order placed successfully!",
//       data: {
//         createdOrder,
//         discountAmount: Number(discountAmount),
//         Total,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     await t.rollback();
//     return res.status(500).json({
//       status: "fail",
//       message: "Something went wrong during checkout!",
//     });
//   }
// };


//2. check out with fixed discount
// const checkOut = async (req, res) => {
  
//   const userId = req.user.id;
//   const { couponCode } = req.body;

//   let deliveryFee = req.body.deliveryFee || 0;

//   const t = await sequelize.transaction();

//   try {
//     let discountAmount = 0;
//     let discountPercentage = 0;


//     // 1. Validating coupon
//     if (couponCode) {
//       const { valid, message, coupon } = await validateCoupon(couponCode, userId);

//       if (!valid) {
//         await t.rollback();
//         return res.status(400).json({
//           status: "fail",
//           message,
//         });
//       }

//       discountAmount = coupon.discountAmount;
//       discountPercentage = coupon.discountAmount;

//       // Mark coupon as used
//       await CouponUsage.create({
//         couponId: coupon.id,
//         userId: userId,
//       }, { transaction: t });
//     }

//     // 2. Fetch cart items
//     const cartItems = await Cart.findAll({
//       where: { userId },
//       include: [{ model: Product, as: "product" }],
//       transaction: t,
//       lock: true // to prevent race condition on stock update
//     });

//     // 3. Check if cart is empty
//     if (!cartItems || cartItems.length === 0) {
//       await t.rollback();
//       return res.status(400).json({
//         status: "fail",
//         message: "Your Cart is empty!",
//       });
//     }

    
//     let ordersToCreate = [];
//     let totalProductAmount = 0;
//     const orderNumber = Math.floor(10000 + Math.random() * 90000); // 5-digit number

//     // 4. Create order items and update stock
//     for (const item of cartItems) {
//       const product = item.product;
//       const quantity = item.productQuantity;

//       if (product.stockQuantity < quantity) {
//         await t.rollback();
//         return res.status(400).json({
//           status: "fail",
//           message: `Insufficient stock for product: ${product.name}`,
//         });
//       }

//       const itemTotal = product.price * quantity;
//       totalProductAmount += itemTotal;

//       // Prepare order data
//       ordersToCreate.push({
//         userId,
//         productId: product.id,
//         productQuantity: quantity,
//         itemTotalPrice: itemTotal,
//         orderNumber,
//         discount: item.discount || 0,
//         totalAmount: itemTotal,
//         status: "pending",
//         deliveryAddress: req.body.deliveryAddress,
//         deliveryFee,
//       });

      
//       // 5. Update stock
//       const newStock = product.stockQuantity - quantity;
//       await product.update({
//         stockQuantity: newStock,
//         isInStock: newStock > 0
//       }, { transaction: t });
//     }

//     // 6. Apply coupon discount
//     const Total = (totalProductAmount - discountAmount) + deliveryFee;
//     const Total1 = (discountPercentage * totalProductAmount) / 100;

//     //calculate totals
      
//     let discount = 0;
//     for (const item of cartItems) {
//       totalProductAmount += item.itemTotalPrice;
//       discount += item.discount;
//     }
//     const Discount = (discount - discountAmount) + Number(deliveryFee);

//     // 7. Create order
//     const createdOrder = await Order.bulkCreate(ordersToCreate, { transaction: t });

//     // 8. Clear cart
//     await Cart.destroy({ where: { userId }, transaction: t });

//     // 9. Commit transaction
//     await t.commit();

//     // 10. Respond
//     return res.status(201).json({
//       status: "success",
//       message: "Order placed successfully!",
//       data: {
//         createdOrder,
//         cartItems,
//         Subtotal: Total,
//         deliveryFee,
//         CouponDiscount: discountAmount,
//         Discount,
//         Total: Discount,
//         Total_After_Discount_Percentage: Total1,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     await t.rollback();
//     return res.status(500).json({
//       status: "fail",
//       message: "Something went wrong during checkout!",
//     });
//   }
// };

//3. 
const checkOut = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email,phone, notes, couponCode, deliveryAddress, deliveryFee = 0 } = req.body;

  const t = await sequelize.transaction();

  try {
    let couponDiscountPercent = 0;
    let couponDiscountAmount = 0;

    // 1. Validate Coupon (if provided)
    if (couponCode) {
      const { valid, message, coupon } = await validateCoupon(couponCode, userId);
      if (!valid) {
        await t.rollback();
        return res.status(400).json({ status: "fail", message });
      }

      couponDiscountPercent = Number(coupon.discountAmount); // Assume percentage
      await CouponUsage.create({ couponId: coupon.id, userId }, { transaction: t });
    }

    // 2. Fetch Cart Items
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Product, as: "product" }],
      transaction: t,
      lock: true,
    });

    if (!cartItems.length) {
      await t.rollback();
      return res.status(400).json({
        status: "fail",
        message: "Your Cart is empty!",
      });
    }

    // 3. Build Orders & Update Stock
    const orderNumber = Math.floor(10000 + Math.random() * 90000);
    let subtotal = 0;
    let productLevelDiscount = 0;
    const ordersToCreate = [];

    for (const item of cartItems) {
      const product = item.product;
      const quantity = item.productQuantity;

      if (product.stockQuantity < quantity) {
        await t.rollback();
        return res.status(400).json({
          status: "fail",
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const itemTotal = Number(item.itemTotalPrice);
      const discount = Number(item.discount || 0);

      subtotal += itemTotal;
      productLevelDiscount += discount;

      ordersToCreate.push({
        userId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        notes: notes,
        phone: phone,
        productId: product.id,
        productQuantity: quantity,
        itemTotalPrice: itemTotal,
        discount,
        totalAmount: itemTotal,
        orderNumber,
        status: "pending",
        deliveryAddress,
        deliveryFee,
      });

      // Update stock
      const newStock = product.stockQuantity - quantity;
      await product.update({
        stockQuantity: newStock,
        isInStock: newStock > 0,
      }, { transaction: t });
    }

    // 4. Apply coupon percentage discount
    if (couponDiscountPercent > 0) {
      couponDiscountAmount = (subtotal * couponDiscountPercent) / 100;
    }

    const totalPayable = subtotal - couponDiscountAmount + Number(deliveryFee);

    // 5. Create Orders
    const createdOrder = await Order.bulkCreate(ordersToCreate, { transaction: t });

    // 6. Clear Cart
    await Cart.destroy({ where: { userId }, transaction: t });

    // 7. Commit Transaction
    await t.commit();

    // 8. Return Response
    return res.status(201).json({
      status: "success",
      message: "Order placed successfully!",
      data: {
        createdOrder,
        orderNumber,
        cartItems,
        Subtotal: subtotal,
        deliveryFee: Number(deliveryFee),
        ProductLevelDiscount: productLevelDiscount,
        CouponDiscount: couponDiscountAmount,
        TotalPayable: totalPayable,
      },
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    await t.rollback();
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong during checkout!",
    });
  }
};



const orderHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    const groupedOrders = orders.reduce((acc, order) => {
      const key = order.orderNumber;
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    }, {});

    if (orders.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No Orders found!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Orders History!",
      data: {
        groupedOrders,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong during finding orders!",
    });
  }
};

const specificOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;

    const order = await Order.findAll({
      where: { userId, orderNumber },
      include: [{ model: Product, as: "product" }], // optional, if you want product info
      order: [["createdAt", "ASC"]],
    });
    if (order.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found!",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong during finding orders!",
    });
  }
};

const changeOrderStatus = async (req, res) => {
  try {
    // const userId = req.user.id;
    const { orderNumber } = req.params;
    const { status, userId } = req.body;

    console.log("user's id::", userId);
    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "User ID is required in the body.",
      });
    }

    const validStatuses = ["pending", "cancelled", "delivered"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message:
          "Please enter a valid status: pending, cancelled, or delivered",
      });
    }

    const orders = await Order.findAll({
      where: { userId, orderNumber },
    });

    if (orders.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found!",
      });
    }

    // Check if all order items are already cancelled
    const checkAll = orders.every((order) => order.status === status);

    if (checkAll) {
      return res.status(400).json({
        status: "fail",
        message: `Order is already ${status}`,
      });
    }

    // Update the status of each order item
    for (let order of orders) {
      order.status = status;
      await order.save();
    }

    return res.status(200).json({
      status: "success",
      message: "Order status updated!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong during finding orders!",
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;
    const { status } = req.body;

    // console.log("user's id::", userId)
    // if (!userId) {
    //     return res.status(400).json({
    //         status: 'fail',
    //         message: 'User ID is required in the body.'
    //     });
    // }

    const validStatuses = ["cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message:
          'Invalid status. Only "cancelled" is allowed for this operation',
      });
    }

    const orders = await Order.findAll({
      where: { userId, orderNumber },
    });

    if (orders.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found!",
      });
    }

    // Check if all order items are already cancelled
    const allCancelled = orders.every((order) => order.status === "cancelled");

    if (allCancelled) {
      return res.status(400).json({
        status: "fail",
        message: "Order is already cancelled.",
      });
    }

    // Update the status of each order item
    for (let order of orders) {
      order.status = status;
      await order.save();
    }

    return res.status(200).json({
      status: "success",
      message: "Order status updated!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong during finding orders!",
    });
  }
};

module.exports = {
  checkOut,
  orderHistory,
  specificOrder,
  changeOrderStatus,
  cancelOrder,
};
