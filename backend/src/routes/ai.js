const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate, checkSubscription } = require('../middleware/auth');
const { Subscription } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

// POST /api/ai/generate-content - Generate content for posts
router.post('/generate-content', authenticate, async (req, res, next) => {
  try {
    const { platform, topic, tone, length, keywords, includeHashtags, provider = 'openai', prompt } = req.body;

    // Check AI service availability
    if (!openai && !anthropic) {
      throw new AppError('AI service not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.', 503);
    }

    // Check AI credits
    const subscription = req.user.subscription;
    if (subscription && typeof subscription.canUseAI === 'function' && !subscription.canUseAI()) {
      throw new AppError('AI credits exhausted. Please upgrade your plan.', 403);
    }

    // Use prompt if topic is not provided (for backward compatibility)
    const contentTopic = topic || prompt || 'social media';
    const contentPlatform = platform || 'twitter';

    let content;

    const systemPrompt = `You are a professional social media content creator.
Create engaging ${contentPlatform} content that resonates with the audience.
Tone: ${tone || 'professional'}
Length: ${length || 'medium'} (short: 1-2 sentences, medium: 3-5 sentences, long: 1-2 paragraphs)
${keywords ? `Include these keywords naturally: ${keywords.join(', ')}` : ''}
${includeHashtags ? 'Include 3-5 relevant hashtags at the end.' : 'Do not include hashtags.'}

Platform-specific guidelines:
- Twitter/X: Max 280 characters, concise and punchy
- Instagram: Visual-focused, can be longer, use emojis sparingly
- LinkedIn: Professional tone, industry insights, thought leadership
- Facebook: Conversational, engaging, call-to-action
- YouTube: Description-focused, include timestamps if relevant`;

    if (provider === 'anthropic' && anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Create a ${contentPlatform} post about: ${contentTopic}` }
        ]
      });
      content = response.content[0].text;
    } else if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a ${contentPlatform} post about: ${contentTopic}` }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      content = response.choices[0].message.content;
    } else {
      throw new AppError('No AI provider available', 503);
    }

    // Deduct AI credits
    if (subscription) {
      await Subscription.update(
        { 'usage.aiCreditsUsed': (subscription.usage?.aiCreditsUsed || 0) + 1 },
        { where: { userId: req.user.id } }
      );
    }

    res.json({
      success: true,
      data: {
        content,
        creditsUsed: 1,
        creditsRemaining: (subscription?.limits?.aiCredits || 0) - (subscription?.usage?.aiCreditsUsed || 0) - 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/improve-content - Improve existing content
router.post('/improve-content', authenticate, async (req, res, next) => {
  try {
    const { content, platform, improvementType, provider = 'openai' } = req.body;

    // Check AI service availability
    if (!openai && !anthropic) {
      throw new AppError('AI service not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.', 503);
    }

    const subscription = req.user.subscription;
    if (subscription && typeof subscription.canUseAI === 'function' && !subscription.canUseAI()) {
      throw new AppError('AI credits exhausted. Please upgrade your plan.', 403);
    }

    const improvementPrompts = {
      engaging: 'Make this content more engaging and attention-grabbing',
      professional: 'Make this content more professional and polished',
      concise: 'Make this content more concise while keeping the main message',
      expand: 'Expand on this content with more details and depth',
      hashtags: 'Add relevant hashtags to this content',
      cta: 'Add a compelling call-to-action'
    };

    const prompt = `${improvementPrompts[improvementType] || 'Improve this content'}.
Keep it suitable for ${platform}.
Original content: "${content}"`;

    let improvedContent;

    if (provider === 'anthropic' && anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });
      improvedContent = response.content[0].text;
    } else if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      });
      improvedContent = response.choices[0].message.content;
    } else {
      throw new AppError('No AI provider available', 503);
    }

    if (subscription) {
      await Subscription.update(
        { 'usage.aiCreditsUsed': (subscription.usage?.aiCreditsUsed || 0) + 1 },
        { where: { userId: req.user.id } }
      );
    }

    res.json({
      success: true,
      data: { content: improvedContent }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/generate-reply - Generate reply to a message/comment
router.post('/generate-reply', authenticate, async (req, res, next) => {
  try {
    const { message, context, tone = 'friendly', provider = 'openai' } = req.body;

    // Check AI service availability
    if (!openai && !anthropic) {
      throw new AppError('AI service not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.', 503);
    }

    const subscription = req.user.subscription;
    if (subscription && typeof subscription.canUseAI === 'function' && !subscription.canUseAI()) {
      throw new AppError('AI credits exhausted. Please upgrade your plan.', 403);
    }

    const prompt = `Generate a ${tone} reply to this message.
${context ? `Context: ${context}` : ''}
Message: "${message}"

Keep the reply natural, helpful, and appropriate. Don't be overly formal unless the tone calls for it.`;

    let reply;

    if (provider === 'anthropic' && anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });
      reply = response.content[0].text;
    } else if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300
      });
      reply = response.choices[0].message.content;
    } else {
      throw new AppError('No AI provider available', 503);
    }

    if (subscription) {
      await Subscription.update(
        { 'usage.aiCreditsUsed': (subscription.usage?.aiCreditsUsed || 0) + 1 },
        { where: { userId: req.user.id } }
      );
    }

    res.json({
      success: true,
      data: { reply }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/hashtag-suggestions - Get hashtag suggestions
router.post('/hashtag-suggestions', authenticate, async (req, res, next) => {
  try {
    const { content, platform, count = 10 } = req.body;

    if (!openai) {
      throw new AppError('AI service not configured. Please set OPENAI_API_KEY.', 503);
    }

    const subscription = req.user.subscription;
    if (subscription && typeof subscription.canUseAI === 'function' && !subscription.canUseAI()) {
      throw new AppError('AI credits exhausted. Please upgrade your plan.', 403);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'user',
        content: `Suggest ${count} relevant hashtags for this ${platform} post.
Return only the hashtags, one per line, without the # symbol.
Post content: "${content}"`
      }],
      max_tokens: 200
    });

    const hashtags = response.choices[0].message.content
      .split('\n')
      .map(h => h.trim().replace('#', ''))
      .filter(h => h);

    if (subscription) {
      await Subscription.update(
        { 'usage.aiCreditsUsed': (subscription.usage?.aiCreditsUsed || 0) + 1 },
        { where: { userId: req.user.id } }
      );
    }

    res.json({
      success: true,
      data: { hashtags }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/analyze-sentiment - Analyze sentiment of messages/comments
router.post('/analyze-sentiment', authenticate, checkSubscription('pro'), async (req, res, next) => {
  try {
    const { texts } = req.body;

    if (!openai) {
      throw new AppError('AI service not configured. Please set OPENAI_API_KEY.', 503);
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new AppError('Texts array is required', 400);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'user',
        content: `Analyze the sentiment of each text. Return JSON array with objects containing:
- text: the original text
- sentiment: positive/negative/neutral
- score: -1 to 1
- explanation: brief explanation

Texts: ${JSON.stringify(texts)}`
      }],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: { analysis }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
