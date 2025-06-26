const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(30).required(),
  lastName: Joi.string().trim().min(2).max(30).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  passwordConfirm: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required()
    .messages({
      'string.pattern.base': 'Phone number must be 10 to 15 digits',
      'any.required': 'Phone number is required'
    }),
  address: Joi.string(),
  profilePic: Joi.string().uri().messages(),
  role: Joi.string().valid('user', 'admin')
});

module.exports = { registerSchema };

