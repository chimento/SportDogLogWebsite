const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// RevenueCat API helper functions
const RevenueCatAPI = {
  async updateSubscriber(userId, subscriptionData) {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REVENUECAT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_user_id: userId,
        fetch_token: subscriptionData.subscriptionId,
        platform: 'stripe',
        price_in_purchased_currency: subscriptionData.priceInCents,
        currency: subscriptionData.currency,
        is_family_share: false,
        store_product_id: subscriptionData.productId,
        store_user_id: subscriptionData.customerId
      })
    });

    if (!response.ok) {
      throw new Error(`RevenueCat API error: ${response.status} ${await response.text()}`);
    }

    return await response.json();
  },

  async createEntitlement(userId, entitlement) {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}/entitlements/${entitlement}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REVENUECAT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entitlement_id: entitlement,
        product_id: entitlement === 'premium' ? 'premium_subscription' : entitlement
      })
    });

    if (!response.ok) {
      throw new Error(`RevenueCat entitlement API error: ${response.status} ${await response.text()}`);
    }

    return await response.json();
  }
};

// Stripe webhook handler
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Processing Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleCheckoutCompleted(session) {
  console.log('Checkout completed:', session.id);
  
  const userId = session.metadata.userId;
  const planType = session.metadata.planType;
  
  if (!userId) {
    console.error('No userId found in session metadata');
    return;
  }

  try {
    // Retrieve the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    const subscriptionData = {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      productId: planType === 'monthly' ? 'monthly_premium' : 'annual_premium',
      priceInCents: subscription.items.data[0].price.unit_amount,
      currency: subscription.items.data[0].price.currency,
      status: subscription.status
    };

    // Update RevenueCat with subscription info
    await RevenueCatAPI.updateSubscriber(userId, subscriptionData);
    
    // Grant premium entitlement
    await RevenueCatAPI.createEntitlement(userId, 'premium');
    
    console.log(`Successfully activated subscription for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  const userId = subscription.metadata.revenuecat_user_id || subscription.metadata.userId;
  
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  try {
    const subscriptionData = {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      productId: subscription.metadata.planType === 'monthly' ? 'monthly_premium' : 'annual_premium',
      priceInCents: subscription.items.data[0].price.unit_amount,
      currency: subscription.items.data[0].price.currency,
      status: subscription.status
    };

    await RevenueCatAPI.updateSubscriber(userId, subscriptionData);
    console.log(`Subscription created for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const userId = subscription.metadata.revenuecat_user_id || subscription.metadata.userId;
  
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  try {
    const subscriptionData = {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      productId: subscription.metadata.planType === 'monthly' ? 'monthly_premium' : 'annual_premium',
      priceInCents: subscription.items.data[0].price.unit_amount,
      currency: subscription.items.data[0].price.currency,
      status: subscription.status
    };

    await RevenueCatAPI.updateSubscriber(userId, subscriptionData);
    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCanceled(subscription) {
  console.log('Subscription canceled:', subscription.id);
  
  const userId = subscription.metadata.revenuecat_user_id || subscription.metadata.userId;
  
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  try {
    // RevenueCat will handle entitlement expiration based on the subscription end date
    // We just need to update the subscription status
    const subscriptionData = {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      productId: subscription.metadata.planType === 'monthly' ? 'monthly_premium' : 'annual_premium',
      priceInCents: subscription.items.data[0].price.unit_amount,
      currency: subscription.items.data[0].price.currency,
      status: 'canceled'
    };

    await RevenueCatAPI.updateSubscriber(userId, subscriptionData);
    console.log(`Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  if (!invoice.subscription) {
    return; // Not a subscription payment
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.revenuecat_user_id || subscription.metadata.userId;
    
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    // Renewal successful - ensure entitlements are active
    await RevenueCatAPI.createEntitlement(userId, 'premium');
    console.log(`Payment succeeded for user ${userId}, entitlements renewed`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', invoice.id);
  
  if (!invoice.subscription) {
    return; // Not a subscription payment
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.revenuecat_user_id || subscription.metadata.userId;
    
    if (userId) {
      console.log(`Payment failed for user ${userId}, subscription: ${subscription.id}`);
      // RevenueCat will handle grace period and entitlement expiration
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

module.exports = router;