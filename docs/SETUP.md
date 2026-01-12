# Setup Guide

Complete guide for setting up the Social Media Manager application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Setup](#docker-setup)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [OAuth Configuration](#oauth-configuration)

---

## Prerequisites

### Required Software
- **Node.js** 18.0.0 or higher
- **Flutter** 3.x (latest stable)
- **PostgreSQL** 14 or higher
- **Redis** 6 or higher
- **Git**

### Optional
- **Docker** & **Docker Compose** (for containerized setup)
- **Railway CLI** (for Railway deployment)
- **Vercel CLI** (for Vercel deployment)

### Verify Installation
```bash
node --version    # Should be >= 18.0.0
flutter --version # Should be >= 3.0.0
psql --version    # Should be >= 14
redis-cli --version
```

---

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/Fokha/social-media-manager.git
cd social-media-manager
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required .env variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/social_media_manager

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

**Start the backend:**
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

### 3. Flutter App Setup

```bash
cd flutter_app

# Install dependencies
flutter pub get

# Run on Chrome (web)
flutter run -d chrome --web-port=3001

# Run on iOS simulator
flutter run -d ios

# Run on Android emulator
flutter run -d android
```

### 4. Database Initialization

```bash
# Create database
createdb social_media_manager

# Or using psql
psql -U postgres -c "CREATE DATABASE social_media_manager;"

# Tables are auto-created by Sequelize on first run
```

---

## Docker Setup

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset (including volumes)
docker-compose down -v
```

### Services Started
- **backend**: http://localhost:3000
- **postgres**: localhost:5432
- **redis**: localhost:6379

### Build Individual Images

```bash
# Backend
cd backend
docker build -t social-media-manager-backend .

# Run
docker run -p 3000:3000 --env-file .env social-media-manager-backend
```

---

## Production Deployment

### Railway (Recommended for Backend)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   cd backend
   railway init
   railway add --plugin postgresql
   railway add --plugin redis
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=$(openssl rand -hex 32)
   ```

### Vercel (Recommended for Frontend)

1. **Build Flutter Web**
   ```bash
   cd flutter_app
   flutter build web --release --no-tree-shake-icons
   ```

2. **Deploy**
   ```bash
   cd build/web
   vercel --prod
   ```

### Alternative: Heroku

```bash
# Backend
cd backend
heroku create social-media-manager-api
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

---

## Environment Variables

### Backend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | `7d` |
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment mode | No | `development` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No | - |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | No | - |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | No | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No | - |

### OAuth Variables (for social platform connections)

| Variable | Description |
|----------|-------------|
| `TWITTER_CLIENT_ID` | Twitter/X OAuth client ID |
| `TWITTER_CLIENT_SECRET` | Twitter/X OAuth client secret |
| `INSTAGRAM_CLIENT_ID` | Instagram OAuth client ID |
| `INSTAGRAM_CLIENT_SECRET` | Instagram OAuth client secret |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth client secret |
| `FACEBOOK_APP_ID` | Facebook App ID |
| `FACEBOOK_APP_SECRET` | Facebook App secret |
| `YOUTUBE_CLIENT_ID` | YouTube/Google OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | YouTube/Google OAuth client secret |

---

## Database Setup

### PostgreSQL Configuration

```sql
-- Create user (if needed)
CREATE USER social_manager WITH PASSWORD 'your_password';

-- Create database
CREATE DATABASE social_media_manager OWNER social_manager;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE social_media_manager TO social_manager;
```

### Schema Migration

Tables are automatically created by Sequelize ORM when the server starts. The following tables are created:

- `users` - User accounts
- `social_accounts` - Connected social media accounts
- `posts` - Created posts
- `messages` - Social media messages
- `subscriptions` - User subscription plans
- `notifications` - User notifications

### Seed Data

```bash
# Create admin user
cd backend
node src/scripts/seedAdmin.js
```

---

## OAuth Configuration

### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app
3. Enable OAuth 2.0
4. Set callback URL: `http://localhost:3000/api/oauth/twitter/callback`
5. Copy Client ID and Secret to `.env`

### Instagram/Facebook

1. Go to [Meta Developer Portal](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Set callback URL: `http://localhost:3000/api/oauth/instagram/callback`
5. Copy credentials to `.env`

### LinkedIn

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Request r_liteprofile and w_member_social permissions
4. Set callback URL: `http://localhost:3000/api/oauth/linkedin/callback`
5. Copy credentials to `.env`

### YouTube/Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Set callback URL: `http://localhost:3000/api/oauth/youtube/callback`
6. Copy credentials to `.env`

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
pg_isready
# Check connection
psql $DATABASE_URL -c "SELECT 1"
```

**Redis connection failed:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

**Flutter build failed:**
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter build web --release --no-tree-shake-icons
```

### Getting Help

- Check [GitHub Issues](https://github.com/Fokha/social-media-manager/issues)
- Review logs: `docker-compose logs -f`
- Backend logs: Check `logs/` directory
