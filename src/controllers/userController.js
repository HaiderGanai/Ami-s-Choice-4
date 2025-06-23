const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');


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

const updateProfile = async (req, res) => {
  try {
    const user = req.user;

    // No data provided check (body empty and no file)
    if (!req.body || (Object.keys(req.body).length === 0 && !req.file)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Provide data to update!',
      });
    }

    const { firstName, lastName, phone, address } = req.body;

    // Build updated data
    const updateData = {
      firstName,
      lastName,
      phone,
      address,
    };

    // If new profile picture is uploaded
    if (req.file) {
      updateData.profilePic = `/uploads/products/${req.file.filename}`;
    }

    // Update the user
    await user.update(updateData);

    // Fetch updated user using scope to exclude password
    const updatedUser = await User.scope('withoutPassword').findByPk(user.id);

    return res.status(200).json({
      status: 'success',
      message: 'User profile updated successfully!',
      data: updatedUser,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong!',
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