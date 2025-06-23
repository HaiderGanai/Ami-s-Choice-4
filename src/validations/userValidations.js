const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(30).required(),
  lastName: Joi.string().trim().min(2).max(30).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  passwordConfirm: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  address: Joi.string().optional(),
  profilePic: Joi.string().uri().optional(),
  role: Joi.string().valid('user', 'admin').optional()
});

module.exports = { registerSchema };
