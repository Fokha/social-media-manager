# Social Media Manager

A comprehensive social media management platform with a Flutter frontend and Node.js backend.

## Features

### User Features
- **Dashboard** - Overview of accounts, posts, messages, and AI credits
- **Find Me** - Crawl social media to find mentions of your accounts across platforms
- **Multi-Platform Support** - Connect Twitter/X, Instagram, LinkedIn, Facebook, YouTube, Telegram, WhatsApp, GitHub
- **Post Management** - Create, schedule, and manage posts across multiple platforms
- **AI Content Generation** - Generate engaging content using AI (OpenAI/Anthropic)
- **Messages** - Unified inbox for all social media messages
- **Settings** - Theme toggle (light/dark), notifications, language, timezone

### Admin Features
- **User Management** - View, manage, and moderate users
- **API Monitoring** - Monitor API usage and health
- **Billing Dashboard** - View subscription analytics and revenue

## Tech Stack

### Frontend (Flutter)
- Flutter 3.x with Dart
- BLoC/Cubit for state management
- GoRouter for navigation
- Dio for HTTP requests
- SharedPreferences for local storage
- Socket.IO for real-time updates

### Backend (Node.js)
- Express.js REST API
- PostgreSQL database with Sequelize ORM
- Redis for caching and session management
- JWT authentication
- Bull for job queues
- Socket.IO for real-time communication

## Project Structure

```
social-media-manager/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Database, Redis, platform configs
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Platform integrations, queues
│   │   └── utils/          # Helpers, logger, encryption
│   └── package.json
├── flutter_app/            # Flutter frontend
│   ├── lib/
│   │   ├── core/           # Theme, constants, utilities
│   │   ├── features/       # Feature modules (dashboard, posts, etc.)
│   │   └── services/       # API, storage, socket services
│   └── pubspec.yaml
├── frontend/               # Next.js frontend (alternative)
├── docker-compose.yml      # Docker setup
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Flutter 3.x
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/social_media_manager
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

5. Start the server:
```bash
npm run dev
```

### Flutter App Setup

1. Navigate to Flutter app directory:
```bash
cd flutter_app
```

2. Install dependencies:
```bash
flutter pub get
```

3. Run the app:
```bash
# Web
flutter run -d chrome --web-port=3001

# iOS
flutter run -d ios

# Android
flutter run -d android
```

### Docker Setup

Run the entire stack with Docker:
```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Accounts
- `GET /api/accounts` - List connected accounts
- `POST /api/accounts/connect/:platform` - Connect platform
- `DELETE /api/accounts/:id` - Disconnect account

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### AI
- `POST /api/ai/generate-content` - Generate post content
- `POST /api/ai/improve-content` - Improve existing content
- `POST /api/ai/generate-reply` - Generate reply to message

### Messages
- `GET /api/messages` - List messages
- `POST /api/messages/:id/reply` - Reply to message

### Subscriptions
- `GET /api/subscriptions/usage` - Get usage stats
- `POST /api/subscriptions/upgrade` - Upgrade plan

## Demo Mode

The app runs in demo mode when no authentication token is provided:
- Demo user with Pro subscription
- AI features return mock responses (when no API keys configured)
- All features functional for testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
