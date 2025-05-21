import Joi from 'joi';

const passengerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name must be at most 100 characters',
    'any.required': 'Name is required'
  }),
  age: Joi.number().integer().min(0).max(120).required().messages({
    'number.base': 'Age must be a number',
    'number.integer': 'Age must be an integer',
    'number.min': 'Age must be at least 0',
    'number.max': 'Age must be at most 120',
    'any.required': 'Age is required'
  }),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required().messages({
    'any.only': 'Gender must be one of MALE, FEMALE, or OTHER',
    'any.required': 'Gender is required'
  }),
  hasChildren: Joi.boolean().optional().messages({
    'boolean.base': 'hasChildren must be a boolean'
  })
});

export const bookTicketValidation = Joi.object({
  passengers: Joi.array().items(passengerSchema).min(1).max(5).required().messages({
    'array.base': 'Passengers must be an array',
    'array.min': 'At least one passenger is required',
    'array.max': 'A maximum of 5 passengers can be booked at once',
    'any.required': 'Passengers are required'
  })
});