const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({
                status: 'fail',
                message: 'Please enter all fields!'
            });
        };

        const user = await User.findOne({ where: { email }});
        if(!user){
            return res.status(404).json({
                status: 'fail',
                message: 'User does not exists!'
            });
        };

        if(user.role !== 'admin') {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not authorized on this route!'
            });
        };

        const passMatch = await bcrypt.compare(password, user.password)
                    if(!passMatch){
                        return res.status(400).json({
                        status: 'fail',
                        message: 'Invalid credentials!'
                    });
        };
        //generate JWT token
                    const token = jwt.sign(
                        { id: user.id,
                          email: user.email,
                          role: user.role,  
                         },
                        process.env.JWT_SECRET,
                        { expiresIn: process.env.JWT_EXPIRY}
                    );

                    let firstName = user.firstName;
            let lastName = user.lastName;
            return res.status(200).json({
                status: 'success',
                data: {
                    firstName,
                    lastName,
                    token
                }
            })
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        })
    }
};

module.exports = { login };