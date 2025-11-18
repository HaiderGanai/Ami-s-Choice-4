const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { updateProfileSchema } = require("../validations/updateProfileValidations");



const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Refetch the user using the 'withoutPassword' scope
    const user = await User.scope('withoutPassword').findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found!'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong!'
    });
  }
};

//1. update profile before joi validations
// const updateProfile = async (req, res) => {
//   try {
//     const user = req.user;

//     // Validate input
//     const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });

//     if (error) {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Validation error',
//         errors: error.details.map(d => d.message)
//       });
//     }

//     // No data provided check (body empty and no file)
//     if (!req.body || (Object.keys(req.body).length === 0 && !req.file)) {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Provide data to update!',
//       });
//     }

//     const { firstName, lastName, phone, address } = req.body;

//     // Build updated data
//     const updateData = {
//       firstName,
//       lastName,
//       phone,
//       address,
//     };

//     // If new profile picture is uploaded
//     if (req.file) {
//       updateData.profilePic = `/uploads/products/${req.file.filename}`;
//     }

//     // Update the user
//     await user.update(updateData);

//     // Fetch updated user using scope to exclude password
//     const updatedUser = await User.scope('withoutPassword').findByPk(user.id);

//     return res.status(200).json({
//       status: 'success',
//       message: 'User profile updated successfully!',
//       data: updatedUser,
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: 'fail',
//       message: 'Something went wrong!',
//     });
//   }
// };

//2. update profile after joi validations
const updateProfile = async (req, res) => {
  try {
    const user = req.user;

    // Check for empty body and no file (before Joi validation)
    if (!req.body || (Object.keys(req.body).length === 0 && !req.file)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Provide at least one field to update!',
      });
    }

    // Validate input
    const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation error',
        errors: error.details.map(d => d.message),
      });
    }

    // Build update object only with defined values
    const updateData = {};

    if (value.firstName) updateData.firstName = value.firstName;
    if (value.lastName) updateData.lastName = value.lastName;
    if (value.phone) updateData.phone = value.phone;
    if (value.address) updateData.address = value.address;
    if (value.email) updateData.email = value.email;
    if (req.file) {
      updateData.profilePic = `/uploads/products/${req.file.filename}`;
    }

    // Update the user
    await user.update(updateData);

    // Optionally handle password update
    if (value.password) {
      user.password = value.password;
      await user.save(); // triggers password hashing hooks, if defined
    }

    // Fetch updated user (exclude sensitive fields via scope)
    const updatedUser = await User.scope('withoutPassword').findByPk(user.id);

    return res.status(200).json({
      status: 'success',
      message: 'User profile updated successfully!',
      data: updatedUser,
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong while updating profile!',
    });
  }
};



const deleteProfile = async (req, res) =>{
    try {
        const user = req.user;
        if(!user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Unauthorized - No user found in the request!'
            })
        }
        await user.destroy();
        res.status(200).json({
            status: 'success',
            message: 'Your Profile deleted successfully!'
        })
    } catch (error) {
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong!'
        });
    }
};

const changeUserPassword = async (req, res) => {
    try {
        const { currentPassword, password, passwordConfirm } = req.body;

        if (!currentPassword || !password || !passwordConfirm) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide all the fields!!'
            });
        }

        // 1. Get user
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found!'
            });
        }

        // 2. Check current password
        const passMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passMatch) {
            return res.status(401).json({
                status: 'fail',
                message: 'Your current password is incorrect!'
            });
        }

        //. User cannot enter the previous password
        const isSameAsOld = await bcrypt.compare(password, user.password);
        if (isSameAsOld) {
            return res.status(422).json({
                status: 'fail',
                message: "You cannot use the previous password!"
            });
        }


        // 3. Check new passwords match
        if (password !== passwordConfirm) {
            return res.status(422).json({
                status: 'fail',
                message: 'Passwords should be the same!!'
            });
        }

        // 4. Hash and update
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
        await user.save();

        // 5. Re-authenticate
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        return res.status(200).json({
            status: 'success',
            message: 'Password updated successfully!',
            data: { token }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Something went wrong!'
        });
    }
};


module.exports = { getProfile, updateProfile,deleteProfile, changeUserPassword };