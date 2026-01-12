# Social Media Manager - Setup Guide

## Prerequisites

- Node.js 18+
- Flutter 3.10+
- Docker & Docker Compose (for production)
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

## Quick Start (Demo Mode)

Demo mode runs without database - perfect for development and testing.

### Backend
```bash
cd backend
npm install
DEMO_MODE=true npm run dev
```

### Flutter App
```bash
cd flutter_app
flutter pub get
flutter run -d chrome --web-port=3002
```

Open http://localhost:3002 in your browser.

## Full Setup (Production Mode)

### 1. Environment Configuration

Copy example env files:
```bash
cp backend/.env.example backend/.env
```

### 2. Required Environment Variables

#### Backend (.env)
```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/social_media_manager

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Encryption (for storing OAuth tokens)
ENCRYPTION_KEY=32-character-encryption-key-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# OAuth Credentials (optional - demo mode works without these)
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# AI APIs (optional - demo mode provides mock responses)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### 3. Docker Setup

Start all services:
```bash
docker-compose up -d
```

With development tools (pgAdmin, Redis Commander):
```bash
docker-compose --profile development up -d
```

Services:
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001
- pgAdmin: http://localhost:5050
- Redis Commander: http://localhost:8081

### 4. Database Migration

```bash
cd backend
npm run db:migrate
npm run db:seed  # Optional: seed demo data
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Social Accounts
- `GET /api/accounts` - List connected accounts
- `DELETE /api/accounts/:id` - Disconnect account
- `POST /api/accounts/:id/refresh` - Refresh token

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish now

### AI
- `POST /api/ai/generate-content` - Generate post content
- `POST /api/ai/improve-content` - Improve existing content
- `POST /api/ai/generate-reply` - Generate reply to message
- `POST /api/ai/hashtag-suggestions` - Get hashtag suggestions

### Messages
- `GET /api/messages` - List messages
- `GET /api/messages/conversations` - Get conversations
- `POST /api/messages/send` - Send message
- `GET /api/messages/unread-count` - Get unread count

### Subscriptions
- `GET /api/subscriptions/usage` - Get usage stats
- `POST /api/subscriptions/upgrade` - Upgrade plan
- `POST /api/subscriptions/cancel` - Cancel subscription

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - List users

## OAuth Setup

### Twitter/X
1. Go to https://developer.twitter.com
2. Create a project and app
3. Enable OAuth 2.0
4. Add callback URL: `http://localhost:3000/api/oauth/twitter/callback`
5. Copy Client ID and Secret to .env

### Instagram/Facebook
1. Go to https://developers.facebook.com
2. Create an app
3. Add Instagram Basic Display
4. Add callback URL: `http://localhost:3000/api/oauth/instagram/callback`
5. Copy App ID and Secret to .env

### LinkedIn
1. Go to https://www.linkedin.com/developers
2. Create an app
3. Add OAuth 2.0 settings
4. Add callback URL: `http://localhost:3000/api/oauth/linkedin/callback`
5. Copy Client ID and Secret to .env

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Flutter Tests
```bash
cd flutter_app
flutter test
```

## Deployment

### Using Docker
```bash
docker-compose --profile production up -d
```

### Manual Deployment

1. Build Flutter web:
```bash
cd flutter_app
flutter build web
```

2. Build backend:
```bash
cd backend
npm run build
```

3. Deploy to your preferred hosting (Vercel, Railway, AWS, etc.)

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run with `DEMO_MODE=true` to bypass database

### OAuth not working
- Verify callback URLs match exactly
- Check credentials are correct
- Ensure app is in "Live" mode (not sandbox)

### AI generation fails
- In demo mode, mock responses are returned
- For real AI, add OPENAI_API_KEY or ANTHROPIC_API_KEY

## Support

For issues, please open a GitHub issue at:
https://github.com/Fokha/social-media-manager/issues
