const Joi = require('joi');

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(30),
  lastName: Joi.string().trim().min(2).max(30),
  email: Joi.string().email().lowercase(),
  password: Joi.string().min(6),
  passwordConfirm: Joi.string().valid(Joi.ref('password')).when('password', {
    is: Joi.exist(),
    then: Joi.required()
  }).messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password'
  }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/),
  address: Joi.string(),
  profilePic: Joi.string().uri(),
  role: Joi.string().valid('user', 'admin')
});

module.exports = {updateProfileSchema};