const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const isAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;

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
        console.log("decoded", decoded);

        if(!user) {
            return res.status(404).json({
            status: 'fail',
            message: 'User not found!'
        })
        }
        if(user.role !== 'admin'){
            return res.status(403).json({
            status: 'fail',
            message: 'You do not have access to perform this action'
        });
        console.log('user status::', user.role)
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

module.exports = { isAdmin };