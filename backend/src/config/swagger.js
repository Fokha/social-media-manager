const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Media Manager API',
      version: '1.0.0',
      description: 'A comprehensive API for managing social media accounts, posts, messages, and analytics across multiple platforms.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatar: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
            isActive: { type: 'boolean' },
            isEmailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        SocialAccount: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            platform: {
              type: 'string',
              enum: ['youtube', 'instagram', 'twitter', 'linkedin', 'snapchat', 'whatsapp', 'telegram', 'github', 'email']
            },
            platformUsername: { type: 'string' },
            platformDisplayName: { type: 'string' },
            profilePicture: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            lastSyncAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            contentType: { type: 'string', enum: ['text', 'image', 'video', 'carousel', 'story', 'reel', 'thread'] },
            mediaUrls: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['draft', 'scheduled', 'publishing', 'published', 'failed'] },
            scheduledAt: { type: 'string', format: 'date-time', nullable: true },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            analytics: {
              type: 'object',
              properties: {
                likes: { type: 'integer' },
                comments: { type: 'integer' },
                shares: { type: 'integer' },
                views: { type: 'integer' }
              }
            }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            plan: { type: 'string', enum: ['free', 'basic', 'pro', 'business', 'enterprise'] },
            status: { type: 'string', enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'] },
            limits: { type: 'object' },
            usage: { type: 'object' },
            currentPeriodEnd: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Unauthorized', message: 'Authentication token required' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Not Found', message: 'Resource not found' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Validation Error', message: 'Invalid input data' }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Accounts', description: 'Social account management' },
      { name: 'Posts', description: 'Post management' },
      { name: 'Messages', description: 'Message management' },
      { name: 'Subscriptions', description: 'Subscription and billing' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'AI', description: 'AI content generation' },
      { name: 'OAuth', description: 'OAuth authentication flows' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
