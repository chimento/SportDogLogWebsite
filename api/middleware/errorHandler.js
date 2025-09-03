// Global error handling middleware

class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
  }
}

class StripeError extends APIError {
  constructor(stripeError) {
    super(stripeError.message, stripeError.statusCode || 500, {
      type: stripeError.type,
      code: stripeError.code,
      param: stripeError.param
    });
    this.name = 'StripeError';
  }
}

class RevenueCatError extends APIError {
  constructor(message, statusCode = 500, details = null) {
    super(message, statusCode, details);
    this.name = 'RevenueCatError';
  }
}

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert Stripe errors to our error format
  if (err.type && err.type.startsWith('Stripe')) {
    error = new StripeError(err);
  }

  // Log error details
  console.error(`[${new Date().toISOString()}] ${error.name}: ${error.message}`);
  if (error.stack && process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Prepare response
  const response = {
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add details in development mode or for specific error types
  if (process.env.NODE_ENV === 'development' || error.details) {
    response.details = error.details;
  }

  // Add request ID if available (useful for debugging)
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
  }

  // Send error response
  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  APIError,
  StripeError,
  RevenueCatError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};