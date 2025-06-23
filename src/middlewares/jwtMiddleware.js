const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    // console.log("Auth Header::", authHeader)

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({
            status: 'fail',
            message: 'Unauthorized - No token provided!'
        })
    };
    const token =authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        // console.log("decoded", decoded);

        if(!user) {
            return res.status(404).json({
            status: 'fail',
            message: 'User not found!'
        })
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: error
        })
    }
};

// const isAdmin = (req, res, next) => {
//     if (!req.user) {
//         return res.status(403).json({
//             status: 'fail',
//             message: 'Unauthorized - No user information found!'
//         });
//     }

//     if (req.user.status !== 'admin') {
//         console.log('user status', req.user.status);
//         return res.status(403).json({
//             status: 'fail',
//             message: 'You do not have access to perform this action'
//         });
//     }

//     next();
// };


module.exports = { verifyToken };