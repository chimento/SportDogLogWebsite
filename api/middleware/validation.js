// Input validation middleware and utilities

const validateCheckoutRequest = (req, res, next) => {
  const { priceId, userId, planType, email } = req.body;

  const errors = [];

  // Required field validation
  if (!priceId || typeof priceId !== 'string') {
    errors.push('priceId is required and must be a string');
  }

  if (!userId || typeof userId !== 'string') {
    errors.push('userId is required and must be a string');
  }

  if (!planType || !['monthly', 'annual'].includes(planType)) {
    errors.push('planType is required and must be either "monthly" or "annual"');
  }

  // Optional email validation
  if (email && !isValidEmail(email)) {
    errors.push('email must be a valid email address');
  }

  // Price ID format validation
  if (priceId && !priceId.startsWith('price_')) {
    errors.push('priceId must be a valid Stripe price ID starting with "price_"');
  }

  // User ID validation (basic format check)
  if (userId && (userId.length < 3 || userId.length > 128)) {
    errors.push('userId must be between 3 and 128 characters');
  }

  // Plan type and price ID consistency check
  if (planType && priceId) {
    const expectedPriceIds = {
      monthly: process.env.MONTHLY_PRICE_ID,
      annual: process.env.ANNUAL_PRICE_ID
    };

    if (priceId !== expectedPriceIds[planType]) {
      errors.push(`priceId ${priceId} does not match expected price for ${planType} plan`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'sessionId parameter is required'
    });
  }

  if (!sessionId.startsWith('cs_')) {
    return res.status(400).json({
      error: 'Invalid sessionId format. Must be a Stripe checkout session ID starting with "cs_"'
    });
  }

  next();
};

const validateSubscriptionId = (req, res, next) => {
  const { subscriptionId } = req.params;

  if (!subscriptionId || typeof subscriptionId !== 'string') {
    return res.status(400).json({
      error: 'subscriptionId parameter is required'
    });
  }

  if (!subscriptionId.startsWith('sub_')) {
    return res.status(400).json({
      error: 'Invalid subscriptionId format. Must be a Stripe subscription ID starting with "sub_"'
    });
  }

  next();
};

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeUserId(userId) {
  // Remove any potentially harmful characters
  return userId.replace(/[<>\"'%;()&+]/g, '');
}

function sanitizeMetadata(metadata) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    // Only allow specific metadata keys
    if (['userId', 'planType', 'bundleId', 'revenuecat_user_id'].includes(key)) {
      sanitized[key] = typeof value === 'string' ? value.substring(0, 500) : value;
    }
  }
  
  return sanitized;
}

module.exports = {
  validateCheckoutRequest,
  validateSessionId,
  validateSubscriptionId,
  isValidEmail,
  sanitizeUserId,
  sanitizeMetadata
};