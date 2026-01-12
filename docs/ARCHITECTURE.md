# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Flutter Web    │  Flutter Mobile │    Next.js Web (Alt)        │
│  (Port 3001)    │  (iOS/Android)  │                             │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                        │
         └─────────────────┼────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                 │
│                   Express.js (Port 3000)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Auth   │  │  Posts   │  │    AI    │  │ Messages │        │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐         │
│  │              Middleware Layer                      │         │
│  │  (Auth, Rate Limiting, Error Handling, Logging)   │         │
│  └───────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │                 │                        │
         ▼                 ▼                        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐
│ PostgreSQL  │    │    Redis    │    │   External Services     │
│  Database   │    │   Cache     │    │  ┌─────────────────┐   │
│             │    │   Queue     │    │  │ OpenAI/Anthropic│   │
│  - Users    │    │   Session   │    │  │ Twitter API     │   │
│  - Posts    │    │             │    │  │ Instagram API   │   │
│  - Accounts │    │             │    │  │ LinkedIn API    │   │
│  - Messages │    │             │    │  │ Facebook API    │   │
└─────────────┘    └─────────────┘    │  │ YouTube API     │   │
                                       │  └─────────────────┘   │
                                       └─────────────────────────┘
```

## Flutter App Architecture

### Feature-Based Structure

```
lib/
├── core/                    # Shared utilities
│   ├── constants/          # App-wide constants
│   ├── theme/              # Theme definitions
│   └── utils/              # Helper functions
│
├── features/               # Feature modules
│   ├── auth/
│   │   ├── data/           # Data layer
│   │   │   ├── datasources/
│   │   │   ├── models/
│   │   │   └── repositories/
│   │   ├── domain/         # Business logic
│   │   │   ├── entities/
│   │   │   ├── repositories/
│   │   │   └── usecases/
│   │   └── presentation/   # UI layer
│   │       ├── bloc/
│   │       ├── pages/
│   │       └── widgets/
│   │
│   ├── dashboard/
│   ├── posts/
│   ├── messages/
│   ├── accounts/
│   ├── subscription/
│   ├── settings/
│   └── admin/
│
└── services/               # App-wide services
    ├── api_service.dart    # HTTP client
    ├── storage_service.dart # Local storage
    ├── socket_service.dart  # WebSocket
    ├── router.dart          # Navigation
    └── injection.dart       # DI setup
```

### State Management (BLoC Pattern)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Event    │────▶│    Bloc     │────▶│    State    │
└─────────────┘     │   /Cubit    │     └─────────────┘
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Repository  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Service │
                    └─────────────┘
```

## Backend Architecture

### Layer Structure

```
src/
├── config/           # Configuration files
│   ├── database.js   # PostgreSQL connection
│   ├── redis.js      # Redis connection
│   └── platforms.js  # Platform OAuth configs
│
├── middleware/       # Express middleware
│   ├── auth.js       # JWT authentication
│   ├── errorHandler.js
│   └── rateLimiter.js
│
├── models/           # Sequelize models
│   ├── User.js
│   ├── Post.js
│   ├── SocialAccount.js
│   ├── Message.js
│   ├── Subscription.js
│   └── index.js
│
├── routes/           # API routes
│   ├── auth.js
│   ├── posts.js
│   ├── accounts.js
│   ├── messages.js
│   ├── ai.js
│   └── admin.js
│
├── services/         # Business logic
│   ├── platforms/    # Social platform integrations
│   │   ├── BasePlatform.js
│   │   ├── twitter.js
│   │   ├── instagram.js
│   │   └── ...
│   └── queue/        # Background jobs
│       └── postQueue.js
│
└── utils/            # Utilities
    ├── logger.js
    └── encryption.js
```

### Database Schema

```sql
Users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR, hashed)
├── name (VARCHAR)
├── role (ENUM: user, admin)
├── isActive (BOOLEAN)
└── timestamps

SocialAccounts
├── id (UUID, PK)
├── userId (FK → Users)
├── platform (VARCHAR)
├── platformUserId (VARCHAR)
├── accessToken (VARCHAR, encrypted)
├── refreshToken (VARCHAR, encrypted)
├── username (VARCHAR)
├── profileUrl (VARCHAR)
├── isActive (BOOLEAN)
└── timestamps

Posts
├── id (UUID, PK)
├── userId (FK → Users)
├── content (TEXT)
├── mediaUrls (JSON)
├── platforms (JSON)
├── status (ENUM: draft, scheduled, published, failed)
├── scheduledAt (TIMESTAMP)
├── publishedAt (TIMESTAMP)
└── timestamps

Messages
├── id (UUID, PK)
├── accountId (FK → SocialAccounts)
├── externalId (VARCHAR)
├── senderId (VARCHAR)
├── senderName (VARCHAR)
├── content (TEXT)
├── isRead (BOOLEAN)
├── replied (BOOLEAN)
└── timestamps

Subscriptions
├── id (UUID, PK)
├── userId (FK → Users)
├── plan (ENUM: free, basic, pro, business, enterprise)
├── usage (JSON)
├── limits (JSON)
├── stripeCustomerId (VARCHAR)
├── stripeSubscriptionId (VARCHAR)
└── timestamps
```

## Security

### Authentication Flow

```
1. User Login
   ├── POST /auth/login with email/password
   ├── Server validates credentials
   ├── Server generates JWT (7 day expiry)
   └── Client stores token in secure storage

2. Authenticated Requests
   ├── Client sends token in Authorization header
   ├── Server validates JWT signature
   ├── Server loads user with subscription
   └── Request proceeds to route handler

3. Demo Mode (No Token)
   ├── Auth middleware creates demo user object
   ├── Demo user has Pro subscription
   └── No database writes for demo user
```

### Data Security

- Passwords hashed with bcrypt (12 rounds)
- OAuth tokens encrypted at rest (AES-256)
- JWT secrets rotated periodically
- Rate limiting on all endpoints
- CORS configured for allowed origins

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers (sessions in Redis)
- Database connection pooling
- Load balancer ready (health endpoint)
- Queue workers can scale independently

### Caching Strategy

- Redis for session management
- API response caching (5 min TTL)
- Platform API rate limit tracking
- Background job results caching

### Future Improvements

1. **Microservices** - Split AI, posts, messaging into separate services
2. **CDN** - Media storage on S3/CloudFront
3. **GraphQL** - Optional GraphQL API layer
4. **Analytics** - Dedicated analytics service
5. **Multi-Region** - Database replication
