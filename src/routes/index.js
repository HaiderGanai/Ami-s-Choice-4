const { authRouter } = require("./authRoutes");
const { cartRouter } = require("./cartRoutes");
const { categoryRouter } = require("./categoriesRoutes");
const { couponRouter } = require("./couponRoutes");
const { orderRouter } = require("./orderRoutes");
const { productRouter } = require("./productsRoutes");
const { reviewRouter } = require("./reviewRoutes");
const { userRouter } = require("./userRoutes");


const loadRoutes = (app) => {
    app.use('/api/v1/users', authRouter);
    app.use('/api/v1', categoryRouter);
    app.use('/api/v1',productRouter);
    app.use('/api/v1/users',userRouter);
    app.use('/api/v1', cartRouter);
    app.use('/api/v1', orderRouter);
    app.use('/api/v1', couponRouter);
    app.use('/api/v1', reviewRouter);

//     app.all('/:path(*)', (req, res, next) => {
//     res.status(404).json({
//         status: 'fail',
//         message: `Can't find ${req.originalUrl} on this server!`
//     });
// });
    
};



module.exports = { loadRoutes };