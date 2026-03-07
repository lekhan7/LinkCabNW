/**
 * Async wrapper utility to handle async route errors
 * Prevents unhandled promise rejections in Express routes
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
