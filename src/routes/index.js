const { adminRouter } = require("./adminRoute");
const { authRouter } = require("./authRoutes");
const { cartRouter } = require("./cartRoutes");
const { categoryRouter } = require("./categoriesRoutes");
const { couponRouter } = require("./couponRoutes");
const deliverySlotRouter = require("./deliverySlotRoutes");
const { orderRouter } = require("./orderRoutes");
const { productRouter } = require("./productsRoutes");
const { reviewRouter } = require("./reviewRoutes");
const { userRouter } = require("./userRoutes");
const { notificationRouter } = require("./notificationRoutes");
const logger = require('../middlewares/loggerMiddleware');
const { supportFormRouter } = require("./supporFormRoute");


const loadRoutes = (app) => {
    app.use(logger);
    app.use('/api/v1/admin', adminRouter);
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1', categoryRouter);
    app.use('/api/v1',productRouter);
    app.use('/api/v1/users',userRouter);
    app.use('/api/v1', cartRouter);
    app.use('/api/v1', orderRouter);
    app.use('/api/v1', couponRouter);
    app.use('/api/v1', reviewRouter);
    app.use('/api/v1', notificationRouter);
    app.use('/api/delivery-slots', deliverySlotRouter)
    app.use('/api/v1', supportFormRouter);

//     app.all('/:path(*)', (req, res, next) => {
//     res.status(404).json({
//         status: 'fail',
//         message: `Can't find ${req.originalUrl} on this server!`
//     });
// });
    
};



module.exports = { loadRoutes };
