const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const crypto = require('crypto');
const { Subscription, Message, SocialAccount, Notification, User } = require('../models');
const logger = require('../utils/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe webhook - raw body needed for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Stripe webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plan } = session.metadata;

        await Subscription.update(
          {
            stripeSubscriptionId: session.subscription,
            plan,
            status: 'active',
            limits: Subscription.PLAN_LIMITS[plan],
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          { where: { userId } }
        );

        logger.info(`Subscription activated for user ${userId}: ${plan}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

        await Subscription.update(
          {
            status: 'active',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          },
          { where: { stripeSubscriptionId: invoice.subscription } }
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        await Subscription.update(
          { status: 'past_due' },
          { where: { stripeSubscriptionId: invoice.subscription } }
        );

        // Notify user
        const sub = await Subscription.findOne({
          where: { stripeSubscriptionId: invoice.subscription }
        });

        if (sub) {
          await Notification.create({
            userId: sub.userId,
            type: 'subscription_reminder',
            title: 'Payment Failed',
            message: 'Your subscription payment failed. Please update your payment method.',
            priority: 'high'
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await Subscription.update(
          {
            status: 'canceled',
            plan: 'free',
            limits: Subscription.PLAN_LIMITS.free,
            stripeSubscriptionId: null
          },
          { where: { stripeSubscriptionId: subscription.id } }
        );
        break;
      }
    }
  } catch (error) {
    logger.error('Stripe webhook processing error:', error);
  }

  res.json({ received: true });
});

// Instagram/Facebook webhook
router.get('/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/facebook', express.json(), async (req, res) => {
  try {
    const { object, entry } = req.body;

    if (object === 'instagram') {
      for (const e of entry) {
        for (const messaging of e.messaging || []) {
          if (messaging.message) {
            // Find the social account
            const account = await SocialAccount.findOne({
              where: {
                platform: 'instagram',
                platformUserId: messaging.recipient.id
              }
            });

            if (account) {
              // Store the message
              const message = await Message.create({
                userId: account.userId,
                socialAccountId: account.id,
                conversationId: messaging.sender.id,
                platformMessageId: messaging.message.mid,
                direction: 'incoming',
                senderId: messaging.sender.id,
                messageType: messaging.message.attachments ? 'image' : 'text',
                content: messaging.message.text,
                platformTimestamp: new Date(messaging.timestamp)
              });

              // Create notification
              await Notification.create({
                userId: account.userId,
                socialAccountId: account.id,
                type: 'new_message',
                title: 'New Instagram Message',
                message: messaging.message.text?.substring(0, 100) || 'New message received'
              });

              // Real-time notification via Socket.io
              const app = req.app;
              const io = app.get('io');
              io.to(`user:${account.userId}`).emit('message:new', { message });
            }
          }
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    logger.error('Facebook webhook error:', error);
    res.status(500).send('Error');
  }
});

// WhatsApp webhook
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/whatsapp', express.json(), async (req, res) => {
  try {
    const { entry } = req.body;

    for (const e of entry) {
      const changes = e.changes || [];

      for (const change of changes) {
        if (change.field === 'messages') {
          const messages = change.value.messages || [];

          for (const msg of messages) {
            const account = await SocialAccount.findOne({
              where: {
                platform: 'whatsapp',
                platformUserId: change.value.metadata.phone_number_id
              }
            });

            if (account) {
              const message = await Message.create({
                userId: account.userId,
                socialAccountId: account.id,
                conversationId: msg.from,
                platformMessageId: msg.id,
                direction: 'incoming',
                senderId: msg.from,
                messageType: msg.type,
                content: msg.text?.body || msg.caption,
                platformTimestamp: new Date(parseInt(msg.timestamp) * 1000)
              });

              await Notification.create({
                userId: account.userId,
                socialAccountId: account.id,
                type: 'new_message',
                title: 'New WhatsApp Message',
                message: msg.text?.body?.substring(0, 100) || 'New message received'
              });

              const io = req.app.get('io');
              io.to(`user:${account.userId}`).emit('message:new', { message });
            }
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('WhatsApp webhook error:', error);
    res.status(500).send('Error');
  }
});

// Twitter webhook (Account Activity API)
router.get('/twitter', (req, res) => {
  const crcToken = req.query.crc_token;
  const hmac = crypto
    .createHmac('sha256', process.env.TWITTER_CLIENT_SECRET)
    .update(crcToken)
    .digest('base64');

  res.json({ response_token: `sha256=${hmac}` });
});

router.post('/twitter', express.json(), async (req, res) => {
  try {
    const { direct_message_events, for_user_id } = req.body;

    if (direct_message_events) {
      for (const event of direct_message_events) {
        if (event.type === 'message_create') {
          const account = await SocialAccount.findOne({
            where: {
              platform: 'twitter',
              platformUserId: for_user_id
            }
          });

          if (account && event.message_create.sender_id !== for_user_id) {
            const message = await Message.create({
              userId: account.userId,
              socialAccountId: account.id,
              conversationId: event.message_create.sender_id,
              platformMessageId: event.id,
              direction: 'incoming',
              senderId: event.message_create.sender_id,
              messageType: 'text',
              content: event.message_create.message_data.text,
              platformTimestamp: new Date(parseInt(event.created_timestamp))
            });

            const io = req.app.get('io');
            io.to(`user:${account.userId}`).emit('message:new', { message });
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Twitter webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
