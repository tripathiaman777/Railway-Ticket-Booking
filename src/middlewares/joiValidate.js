export const joiValidate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(e => ({ msg: e.message, path: e.path }))
    });
  }
  next();
};