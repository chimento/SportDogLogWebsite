const express = require('express');
const Stripe = require('stripe');
const router = express.Router();
const { validateCheckoutRequest, validateSessionId, validateSubscriptionId } = require('../middleware/validation');
const { asyncHandler, StripeError } = require('../middleware/errorHandler');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe checkout session
router.post('/create-checkout-session', validateCheckoutRequest, asyncHandler(async (req, res) => {
  try {
    const { priceId, userId, planType } = req.body;

    // Validate required fields
    if (!priceId || !userId || !planType) {
      return res.status(400).json({
        error: 'Missing required fields: priceId, userId, and planType are required'
      });
    }

    // Validate planType
    if (!['monthly', 'annual'].includes(planType)) {
      return res.status(400).json({
        error: 'Invalid planType. Must be "monthly" or "annual"'
      });
    }

    // Validate priceId matches expected values
    const expectedPriceIds = {
      monthly: process.env.MONTHLY_PRICE_ID,
      annual: process.env.ANNUAL_PRICE_ID
    };

    if (priceId !== expectedPriceIds[planType]) {
      return res.status(400).json({
        error: 'Invalid priceId for the specified planType'
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: userId,
        planType: planType,
        bundleId: process.env.APP_BUNDLE_ID
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planType: planType,
          bundleId: process.env.APP_BUNDLE_ID,
          revenuecat_user_id: userId
        }
      },
      customer_email: req.body.email || undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    throw new StripeError(error);
  }
}));

// Get checkout session details
router.get('/checkout-session/:sessionId', validateSessionId, asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    res.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      subscriptionId: session.subscription?.id,
      customerId: session.customer?.id,
      metadata: session.metadata
    });

  } catch (error) {
    throw new StripeError(error);
  }
}));

// Get subscription details
router.get('/subscription/:subscriptionId', validateSubscriptionId, asyncHandler(async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    res.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      metadata: subscription.metadata
    });

  } catch (error) {
    throw new StripeError(error);
  }
}));

module.exports = router;