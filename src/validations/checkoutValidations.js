const Joi = require('joi');

const checkoutSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    'string.base': 'First name must be a string',
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters',
    'any.required': 'First name is required'
  }),

  lastName: Joi.string().trim().min(2).max(50).required().messages({
    'string.base': 'Last name must be a string',
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters',
    'any.required': 'Last name is required'
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  }),

  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required().messages({
    'string.pattern.base': 'Phone must be a valid phone number',
    'string.empty': 'Phone is required',
    'any.required': 'Phone is required'
  }),

  notes: Joi.string().allow(null, '').max(1000).messages({
    'string.max': 'Notes can have at most 1000 characters'
  }),

  couponCode: Joi.string().allow(null, '').trim().max(50).messages({
    'string.max': 'Coupon code must be at most 50 characters'
  }),

  deliveryAddress: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Delivery address must be at least 10 characters',
    'string.max': 'Delivery address must be at most 500 characters',
    'any.required': 'Delivery address is required'
  }),

  deliveryFee: Joi.number().min(0).default(0).messages({
    'number.base': 'Delivery fee must be a number',
    'number.min': 'Delivery fee cannot be negative'
  })
});

module.exports = { checkoutSchema };