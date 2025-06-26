const { Sequelize } = require("sequelize");
const { sequelize } = require("../config/dbConnect");
const { Cart, Product, Order, CouponUsage, OrderItem } = require("../models");
const { validateCoupon } = require("../utils/couponValidator");
const { v4: uuidv4 } = require('uuid');
const { checkoutSchema } = require("../validations/checkoutValidations");



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
// const checkOut = async (req, res) => {
//   const userId = req.user.id;
//   const { firstName, lastName, email,phone, notes, couponCode, deliveryAddress, deliveryFee = 0 } = req.body;

//   const t = await sequelize.transaction();

//   try {
//     let couponDiscountPercent = 0;
//     let couponDiscountAmount = 0;

//     // 1. Validate Coupon (if provided)
//     if (couponCode) {
//       const { valid, message, coupon } = await validateCoupon(couponCode, userId);
//       if (!valid) {
//         await t.rollback();
//         return res.status(400).json({ status: "fail", message });
//       }

//       couponDiscountPercent = Number(coupon.discountAmount); // Assume percentage
//       await CouponUsage.create({ couponId: coupon.id, userId }, { transaction: t });
//     }

//     // 2. Fetch Cart Items
//     const cartItems = await Cart.findAll({
//       where: { userId },
//       include: [{ model: Product, as: "product" }],
//       transaction: t,
//       lock: true,
//     });

//     if (!cartItems.length) {
//       await t.rollback();
//       return res.status(400).json({
//         status: "fail",
//         message: "Your Cart is empty!",
//       });
//     }

//     // 3. Build Orders & Update Stock
//     const orderNumber = Math.floor(10000 + Math.random() * 90000);
//     let subtotal = 0;
//     let productLevelDiscount = 0;
//     const ordersToCreate = [];

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

//       const itemTotal = Number(item.itemTotalPrice);
//       const discount = Number(item.discount || 0);

//       subtotal += itemTotal;
//       productLevelDiscount += discount;

//       ordersToCreate.push({
//         userId,
//         firstName: firstName,
//         lastName: lastName,
//         email: email,
//         notes: notes,
//         phone: phone,
//         productId: product.id,
//         productQuantity: quantity,
//         itemTotalPrice: itemTotal,
//         discount,
//         totalAmount: itemTotal,
//         orderNumber,
//         status: "pending",
//         deliveryAddress,
//         deliveryFee,
//       });

//       // Update stock
//       const newStock = product.stockQuantity - quantity;
//       await product.update({
//         stockQuantity: newStock,
//         isInStock: newStock > 0,
//       }, { transaction: t });
//     }

//     // 4. Apply coupon percentage discount
//     if (couponDiscountPercent > 0) {
//       couponDiscountAmount = (subtotal * couponDiscountPercent) / 100;
//     }

//     const totalPayable = subtotal - couponDiscountAmount + Number(deliveryFee);

//     // 5. Create Orders
//     const createdOrder = await Order.bulkCreate(ordersToCreate, { transaction: t });

//     // 6. Clear Cart
//     await Cart.destroy({ where: { userId }, transaction: t });

//     // 7. Commit Transaction
//     await t.commit();

//     // 8. Return Response
//     return res.status(201).json({
//       status: "success",
//       message: "Order placed successfully!",
//       data: {
//         createdOrder,
//         orderNumber,
//         cartItems,
//         Subtotal: subtotal,
//         deliveryFee: Number(deliveryFee),
//         ProductLevelDiscount: productLevelDiscount,
//         CouponDiscount: couponDiscountAmount,
//         TotalPayable: totalPayable,
//       },
//     });

//   } catch (error) {
//     console.error("Checkout Error:", error);
//     await t.rollback();
//     return res.status(500).json({
//       status: "fail",
//       message: "Something went wrong during checkout!",
//     });
//   }
// };

//4. checkout model after adding a junction table
const checkOut = async (req, res) => {
  const { id: userId, email } = req.user;


  // Validate Input
  const { error } = checkoutSchema.validate(req.body);
if (error) {
  return res.status(400).json({
    status: 'fail',
    message: error.details[0].message
  });
}

  const { firstName, lastName, /*email,*/ phone, notes, couponCode, deliveryAddress, deliveryFee = 0 } = req.body;

  const t = await sequelize.transaction();

  try {
    let couponDiscountPercent = 0;
    let couponDiscountAmount = 0;

    // 1. Validate coupon (if any)
    let usedCoupon = null;
    if (couponCode) {
      const { valid, message, coupon } = await validateCoupon(couponCode, userId);
      if (!valid) {
        await t.rollback();
        return res.status(400).json({ status: 'fail', message });
      }

      couponDiscountPercent = Number(coupon.discountAmount);
      usedCoupon = coupon;

      await CouponUsage.create({ couponId: coupon.id, userId }, { transaction: t });
    }

    // 2. Get cart items
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Product, as: "product" }],
      transaction: t,
      lock: true
    });

    if (!cartItems.length) {
      await t.rollback();
      return res.status(400).json({
        status: "fail",
        message: "Your Cart is empty!",
      });
    }

    let subtotal = 0;
    let totalProductDiscount = 0;

    const orderItems = [];

    // 3. Process cart items and stock updates
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
      totalProductDiscount += discount;

      orderItems.push({
        productId: product.id,
        productQuantity: quantity,
        itemTotalPrice: itemTotal,
        discount,
      });

      // Update stock
      const newStock = product.stockQuantity - quantity;
      await product.update({
        stockQuantity: newStock,
        isInStock: newStock > 0
      }, { transaction: t });
    }

    // 4. Calculate coupon discount
    if (couponDiscountPercent > 0) {
      couponDiscountAmount = (subtotal * couponDiscountPercent) / 100;
    }

    const totalPayable = subtotal - couponDiscountAmount + Number(deliveryFee);

    // 5. Create order (single entry)
// const orderNumber = Math.floor(10000 + Math.random() * 90000);  
  const orderNumber = uuidv4(); // ✅ Generates a unique UUID like '550e8400-e29b-41d4-a716-446655440000'


const createdOrder = await Order.create({
  userId,
  firstName,
  lastName,
  email: email,
  notes,
  deliveryAddress,
  phone,
  subTotal: subtotal,
  deliveryFee,
  couponDiscount: couponDiscountAmount,
  discount: totalProductDiscount,
  total: totalPayable,
  orderNumber,                      // ✅ Include orderNumber
  totalAmount: totalPayable,        // ✅ Include totalAmount if required by schema
  status: "pending",
}, { transaction: t });

    // 6. Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: createdOrder.id,
        productId: item.productId,
        productQuantity: item.productQuantity,
        itemTotalPrice: item.itemTotalPrice,
        discount: item.discount,
      }, { transaction: t });
    }

    // 7. Clear cart
    await Cart.destroy({ where: { userId }, transaction: t });

    // 8. Commit
    await t.commit();

    // 9. Response
    return res.status(201).json({
      status: "success",
      message: "Order placed successfully!",
      data: {
        order: createdOrder,
        products: orderItems,
        Subtotal: subtotal,
        deliveryFee: Number(deliveryFee),
        ProductLevelDiscount: totalProductDiscount,
        CouponDiscount: couponDiscountAmount,
        TotalPayable: totalPayable
      }
    });

  } catch (error) {
    console.error("Checkout Error:", error);
    await t.rollback();
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong during checkout!',
    });
  }
};

const orderHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      attributes: [
        'orderNumber',
        ['totalAmount', 'total'], // Correct field
        'status',
        'createdAt',
        [Sequelize.literal(`(
          SELECT SUM(orderItems.productQuantity)
          FROM orderItems
          WHERE orderItems.orderId = order.id
        )`), 'totalItems']
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!orders.length) {
      return res.status(200).json({
        status: 'success',
        message: 'No Orders found!',
        data: []
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Orders History!',
      data: orders
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong during fetching orders!',
    });
  }
};



const specificOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;

    // 1. Find the order by userId and orderNumber
    const order = await Order.findOne({
      where: { userId, orderNumber },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['name', 'image', 'price', 'weight']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found!'
      });
    }

    // 2. Format the product items data
    const items = order.orderItems.map(item => ({
      name: item.product.name,
      image: item.product.image,
      price: item.product.price,
      weight: item.product.weight,
      quantity: item.productQuantity,
      itemsTotalPrice: item.itemTotalPrice
    }));

    // 3. Prepare response data
    const responseData = {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      products: items,
      subTotal: order.subTotal,
      deliveryAddress: order.deliveryAddress,
      deliveryFee: order.deliveryFee,
      couponDiscount: order.discount || 0,
      total: order.totalAmount
    };

    return res.status(200).json({
      status: 'success',
      data: responseData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong while retrieving the order.'
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
