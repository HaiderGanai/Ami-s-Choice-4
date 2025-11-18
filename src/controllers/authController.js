const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require("../utils/sendEmail");
const { Op, where } = require("sequelize");
const { registerSchema } = require("../validations/userValidations");



const register = async (req, res) => {
    try {

        // Validate input
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors: error.details.map(d => d.message)
      });
    }

        const { firstName, lastName, email, password, passwordConfirm, phone, address, role} = req.body;

        // If image is uploaded, build the file path
    let profilePicPath = null;
    if (req.file) {
        profilePicPath = `/uploads/products/${req.file.filename}`;
    }
        
        if(!firstName || !lastName || !email || !password || !passwordConfirm) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please enter all fields'
            });
        };

        const userExists = await User.findOne({ where: { email }});
        if(userExists){
            return res.status(409).json({
                status: 'fail',
                message: 'User already exists!'
            });
        };
        if(password !== passwordConfirm) {
            return res.status(400).json({
            status: 'fail',
            message: 'Passwords do not match'
            });
}

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            address,
            profilePic: profilePicPath,
            role
        });
        console.log("New Register Request")
        res.status(201).json({
            status: 'success',
            data: {
                firstName,
                lastName,
                email,
                phone,
                address
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error
            
        });
        console.log(error);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({
                status: 'fail',
                message: 'Please enter all fields!'
            });
        };
        const userExixts = await User.findOne({ where: { email }});
        if(!userExixts){
            return res.status(409).json({
                status: 'fail',
                message: 'User does not exists!'
            });
        };
        const passMatch = await bcrypt.compare(password, userExixts.password)
            if(!passMatch){
                return res.status(400).json({
                status: 'fail',
                message: 'Invalid credentials!'
            });
            };
            //generate JWT token
            const token = jwt.sign(
                { id: userExixts.id,
                    email: userExixts.email
                 },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY}
            );

            let firstName = userExixts.firstName;
            let lastName = userExixts.lastName;
            return res.status(200).json({
                status: 'success',
                data: {
                    firstName,
                    lastName,
                    token
                }
            });
        
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error
            
        });
        console.log(error)
    }
};

<<<<<<< HEAD
//hanging on render.com, but working perfectly in localhost
// const forgotPassword = async (req, res) => {
//   try {
//     console.log("The control entered the forgot password")
//     const { email } = req.body;
//     console.log("email coming from the request::", email)

//     if (!email) {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Please provide your Email!'
//       });
//     }

//     const user = await User.findOne({ where: { email } });
//     console.log("user found based on the email::", user)

//     if (!user) {
//       return res.status(404).json({
//         status: 'fail',
//         message: 'User does not exist!'
//       });
//     }

//     // Generate 4-digit code
//     const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

//     // Hash the code
//     const hashedToken = crypto.createHash('sha256').update(resetCode).digest('hex');

//     // Set reset fields
//     user.passwordResetToken = hashedToken;
//     user.passwordResetExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

//     await user.save();

//     // HTML email body
//     const html = `
//       <div style="font-family: Arial, sans-serif; padding: 20px;">
//         <h2>Password Reset Code</h2>
//         <p>Your 4-digit password reset code is:</p>
//         <h1 style="letter-spacing: 2px;">${resetCode}</h1>
//         <p>This code is valid for <strong>10 minutes</strong>.</p>
//         <p>If you didn't request this, please ignore this email.</p>
//       </div>
//     `;

//     await sendEmail({
//       email: user.email,
//       subject: 'Your password reset code (valid for 10 minutes)',
//       html
//     });

//     // Optional: log the code in dev mode
//     if (process.env.NODE_ENV !== 'production') {
//       console.log(`🔐 Password reset code for ${email}: ${resetCode}`);
//     }

//     return res.status(200).json({
//       status: 'success',
//       message: 'Reset code sent to your email!',
//     });

//   } catch (error) {
//     console.error('ForgotPassword Error:', error);
//     return res.status(500).json({
//       status: 'error',
//       message: 'Internal server error'
//     });
//   }
// };

const forgotPassword = async (req, res) => {
  try {
    console.log("Entered forgot password endpoint");
=======
const forgotPassword = async (req, res) => {
  try {
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
<<<<<<< HEAD
        message: 'Please provide your Email!',
=======
        message: 'Please provide your Email!'
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
      });
    }

    const user = await User.findOne({ where: { email } });
<<<<<<< HEAD
    console.log("User found:", user ? user.email : null);
=======
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17

    if (!user) {
      return res.status(404).json({
        status: 'fail',
<<<<<<< HEAD
        message: 'User does not exist!',
=======
        message: 'User does not exist!'
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
      });
    }

    // Generate 4-digit code
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Hash the code
    const hashedToken = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Set reset fields
    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
<<<<<<< HEAD
=======

>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
    await user.save();

    // HTML email body
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Code</h2>
        <p>Your 4-digit password reset code is:</p>
        <h1 style="letter-spacing: 2px;">${resetCode}</h1>
        <p>This code is valid for <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

<<<<<<< HEAD
    // Fire-and-forget email sending
    sendEmail({
      email: user.email,
      subject: 'Your password reset code (valid for 10 minutes)',
      html,
    }).catch(err => {
      console.error('Failed to send reset email:', err);
    });

    // Log in dev mode
=======
    await sendEmail({
      email: user.email,
      subject: 'Your password reset code (valid for 10 minutes)',
      html
    });

    // Optional: log the code in dev mode
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 Password reset code for ${email}: ${resetCode}`);
    }

<<<<<<< HEAD
    // Respond immediately to client
    return res.status(200).json({
      status: 'success',
      message: 'Reset code sent to your email (if email service works)!',
=======
    return res.status(200).json({
      status: 'success',
      message: 'Reset code sent to your email!',
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
    });

  } catch (error) {
    console.error('ForgotPassword Error:', error);
    return res.status(500).json({
      status: 'error',
<<<<<<< HEAD
      message: 'Internal server error',
=======
      message: 'Internal server error'
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
    });
  }
};

<<<<<<< HEAD
=======

>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
const verifyOtp = async (req, res) => {
    try {

        const { otp } = req.body;

        if (!otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'OTP is required.'
      });
    }
        // 1. get user based on token
        const hashedToken = crypto.createHash('sha256').update(String(otp)).digest('hex');

        const user = await User.findOne({where: {passwordResetToken: hashedToken,
            passwordResetExpiry: {
                [Op.gt]: Date.now()
            }
        }});
        if(!user) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid OTP!'
            });
        }

        // Clear OTP fields after verification to prevent reuse
        // user.passwordResetToken = null;
        // user.passwordResetExpiry = null;
        // await user.save();

        //generate JWT token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY}
            );

            console.log('Verify OTP api is hit!!!')
        return res.status(200).json({
            status:'success',
            message: 'OTP verfied sussccessfully!',
            data: {
                token
            }
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status:'fail',
            message: 'Internal Server Error!',
            error: error
        })
    }
}

const resetPassword = async (req, res) => {
    try {
        
        const userId = req.user.id;
        const user = await User.findByPk(userId);
        
        // 2. set new password, if token is not expired and user exists // or something happens while updating the password
        // if(!user) {
        //    return res.status(400).json({
        //     status: 'fail',
        //     message: 'Token is invalid or expired'
        // });

        // }
        const { password, passwordConfirm } = req.body;

        if (!password || !passwordConfirm) {
            return res.status(400).json({
            status: 'fail',
            message: 'Please provide both password and passwordConfirm'
  });
}

        if(password !== passwordConfirm) {
            return res.status(400).json({
            status: 'fail',
            message: 'Passwords do not match'
            });
}
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
        user.passwordResetToken = null;
        user.passwordResetExpiry = null;
        await user.save();

        //3. update the updatedAt property for the user

        //4. log the user in, send JWT
         //generate JWT token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY}
            );

            console.log('Reset Password api is hit!!!')
            return res.status(200).json({
                status: 'success',
                data: {
                    token
                }
            });
    } catch (error) {
         res.status(500).json({
            status: 'fail',
            message: 'Something went wrong!'
            
        });
        console.log(error)
    }
};

const logout = async (req, res) => {

}


module.exports = { register, login, forgotPassword, verifyOtp, resetPassword, logout };