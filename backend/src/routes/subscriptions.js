const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { authenticate } = require('../middleware/auth');
const { Subscription, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price IDs for each plan
const PLAN_PRICES = {
  basic: process.env.STRIPE_PRICE_BASIC,
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS
};

// GET /api/subscriptions/current - Get current subscription
router.get('/current', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    res.json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/plans - Get available plans
router.get('/plans', async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
          '2 social accounts',
          '20 posts per month',
          '50 AI credits',
          'Basic analytics'
        ],
        limits: Subscription.PLAN_LIMITS.free
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        priceId: PLAN_PRICES.basic,
        features: [
          '5 social accounts',
          '100 posts per month',
          '500 AI credits',
          'Post scheduling',
          'Email support'
        ],
        limits: Subscription.PLAN_LIMITS.basic
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 99,
        priceId: PLAN_PRICES.pro,
        features: [
          '15 social accounts',
          '500 posts per month',
          '2000 AI credits',
          'Advanced analytics',
          'Team collaboration (5 users)',
          'Priority support'
        ],
        limits: Subscription.PLAN_LIMITS.pro,
        popular: true
      },
      {
        id: 'business',
        name: 'Business',
        price: 299,
        priceId: PLAN_PRICES.business,
        features: [
          '50 social accounts',
          'Unlimited posts',
          '10000 AI credits',
          'Custom workflows',
          'API access',
          'Team collaboration (20 users)',
          'Dedicated account manager'
        ],
        limits: Subscription.PLAN_LIMITS.business
      }
    ];

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/create-checkout - Create Stripe checkout session
router.post('/create-checkout', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!PLAN_PRICES[plan]) {
      throw new AppError('Invalid plan selected', 400);
    }

    let subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    // Create Stripe customer if doesn't exist
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { userId: req.user.id }
      });
      customerId = customer.id;

      await subscription.update({ stripeCustomerId: customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: PLAN_PRICES[plan],
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        userId: req.user.id,
        plan
      }
    });

    res.json({
      success: true,
      data: { sessionId: session.id, url: session.url }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/create-portal - Create customer portal session
router.post('/create-portal', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription?.stripeCustomerId) {
      throw new AppError('No active subscription', 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard/subscription`
    });

    res.json({
      success: true,
      data: { url: session.url }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/cancel - Cancel subscription
router.post('/cancel', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new AppError('No active subscription to cancel', 400);
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    await subscription.update({ cancelAtPeriodEnd: true });

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/resume - Resume canceled subscription
router.post('/resume', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new AppError('No subscription to resume', 400);
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    await subscription.update({ cancelAtPeriodEnd: false });

    res.json({
      success: true,
      message: 'Subscription resumed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/invoices - Get invoice history
router.get('/invoices', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription?.stripeCustomerId) {
      return res.json({
        success: true,
        data: { invoices: [] }
      });
    }

    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 24
    });

    res.json({
      success: true,
      data: {
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          amount: inv.amount_paid / 100,
          currency: inv.currency,
          status: inv.status,
          date: new Date(inv.created * 1000),
          pdfUrl: inv.invoice_pdf
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/usage - Get current usage
router.get('/usage', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    // Return default free tier limits if no subscription exists
    if (!subscription) {
      return res.json({
        success: true,
        data: {
          usage: {
            accounts: 0,
            postsThisMonth: 0,
            aiCreditsUsed: 0
          },
          limits: {
            accounts: 2,
            postsPerMonth: 10,
            aiCredits: 50
          },
          plan: 'free'
        }
      });
    }

    res.json({
      success: true,
      data: {
        usage: subscription.usage || {},
        limits: subscription.limits || {},
        plan: subscription.plan || 'free'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
