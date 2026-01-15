# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2026-01-15

### Added
- **Code Templates**
  - `BaseCRUD` template for unified CRUD operations
  - `BaseOAuth` template for unified OAuth2 flows
  - `CRUDRoutes` helper for route generation
  - Platform presets for Twitter, Instagram, LinkedIn, YouTube, GitHub

- **Real-Time WebSocket Notifications**
  - `socketService.js` - Full Socket.IO integration
  - User connection tracking (online status)
  - Post status updates (publishing/published/failed)
  - New message notifications
  - Account connection updates
  - System announcements
  - Frontend `useSocket.js` hook with React Query integration

- **Media Upload System**
  - `mediaService.js` - Full media handling service
  - Sharp image processing/optimization
  - Thumbnail generation (300x300 default)
  - Platform-specific image resizing
  - Local storage provider (`localStorage.js`)
  - Upload routes: `/api/uploads/single`, `/api/uploads/multiple`, `/api/uploads/resize`
  - Multer integration with file type validation

- **Post Scheduling Queue**
  - Bull queue with Redis backend
  - Automatic retry with exponential backoff
  - Real-time status notifications on publish/fail
  - Job management (schedule, remove, retry)

- **Service Layer Refactoring**
  - `PostService` extending BaseCRUD with custom methods
  - `AccountService` extending BaseCRUD
  - `MessageService` extending BaseCRUD
  - `NotificationService` extending BaseCRUD

- **Frontend Hooks**
  - `usePosts.js` - Post CRUD with React Query
  - `useAccounts.js` - Account management hooks
  - `useMessages.js` - Message/conversation hooks
  - `useSocket.js` - WebSocket hooks for real-time updates

- **Deployment Infrastructure**
  - `deploy.sh` - Automated deployment script
  - `nginx.conf` - Production nginx configuration
  - `.env.example` - Environment template

- **Testing**
  - `BaseCRUD.test.js` - Full CRUD template tests
  - `BaseOAuth.test.js` - OAuth flow tests
  - `socketService.test.js` - WebSocket tests
  - `mediaService.test.js` - Media handling tests
  - 111/114 tests passing (97% pass rate)

### Changed
- OAuth routes refactored to use BaseOAuth template
- Post queue now emits real-time socket notifications
- Index.js updated with socket service initialization

### Technical Details
- Sharp for image processing (jpeg, png, webp, gif support)
- 10MB file size limit, 10 files per upload
- Platform dimensions: Twitter (1200x675), Instagram (1080x1080), LinkedIn (1200x627)
- Socket rooms for user, post, and conversation events

---

## [2.0.0] - 2026-01-12

### Removed
- **Demo Mode Completely Removed**
  - All `isDemoMode()` checks and demo user fallbacks removed
  - All hardcoded mock/placeholder data removed from routes
  - No more demo authentication bypass
  - AI endpoints now require real API keys (OPENAI_API_KEY or ANTHROPIC_API_KEY)
  - OAuth endpoints now require real platform credentials

### Changed
- **Real Database Integration**
  - All routes now use real Sequelize database queries
  - SQLite support for development (zero configuration)
  - PostgreSQL for production deployments
  - Authentication requires valid JWT tokens
  - Subscriptions created automatically on user registration

### Added
- **Production Infrastructure**
  - Docker Compose configurations (dev and prod)
  - Nginx reverse proxy configuration
  - CI/CD workflows for GitHub Actions
  - Database migrations for all models
  - Deployment script (`scripts/deploy.sh`)

- **New Services**
  - Push notification service with Firebase/APNS support
  - OAuth token refresh service
  - Monitoring configuration
  - Swagger API documentation setup

- **Testing**
  - Comprehensive API tests using Jest + Supertest
  - In-memory SQLite for test isolation
  - 40 tests covering auth, posts, accounts, and AI routes
  - Jest configuration with sequential test execution

### Technical Details
- Rate limiting skipped in test environment
- Soft delete pattern for social accounts
- All models properly registered before database sync
- ENCRYPTION_KEY validation (32+ characters)

---

## [1.1.0] - 2026-01-12

### Added
- **OAuth Authentication Template**
  - Google Sign-In support (iOS, Android, Web, macOS)
  - Apple Sign-In support (iOS, macOS, Web)
  - Microsoft/Azure AD Sign-In support (all platforms)
  - Email/Password authentication
  - Unified `OAuthUser` model
  - `OAuthService` with secure token storage
  - `SocialSignInButton` widget with provider-specific styling
  - `SocialSignInIconRow` compact variant
  - `OrDivider` widget for login page layout
  - Forgot password dialog
  - OAuth events in AuthBloc (`GoogleSignInRequested`, `AppleSignInRequested`, `MicrosoftSignInRequested`)

### Changed
- Updated login page with social sign-in buttons
- Enhanced AuthBloc with OAuth handlers

### Technical Details
- `flutter_secure_storage` for token persistence
- Platform-aware Apple Sign-In visibility
- Custom painters for Google and Microsoft logos
- Demo mode support for all OAuth providers

---

## [1.0.0] - 2026-01-12

### Added
- **Flutter App**
  - Dashboard with stats overview (accounts, posts, messages, AI credits)
  - Trending hashtags section
  - Recent mentions section
  - Quick actions (Create Post, Find Me, View Messages, Add Account, AI Assistant)
  - Find Me feature - crawl social media for account mentions across platforms
  - Connected accounts management with platform-specific OAuth
  - Post creation with AI-powered content generation
  - Post scheduling and multi-platform publishing
  - Unified messages inbox with AI-generated replies
  - Subscription management with usage tracking
  - Settings page with functional toggles:
    - Dark/Light theme toggle (light default)
    - Notification preferences
    - Language selection
    - Timezone configuration
    - Profile management dialogs
  - User/Admin mode toggle switch
  - Responsive design (mobile + desktop layouts)

- **Backend API**
  - RESTful API with Express.js
  - JWT authentication with demo mode support
  - Multi-platform OAuth integration:
    - Twitter/X
    - Instagram
    - LinkedIn
    - Facebook
    - YouTube
    - Telegram
    - WhatsApp
    - GitHub
  - AI content generation endpoints (OpenAI/Anthropic)
  - Demo mode with mock AI responses
  - Message aggregation and management
  - Post scheduling with Bull queue
  - Subscription and usage tracking
  - Admin dashboard APIs
  - Real-time updates with Socket.IO

- **Infrastructure**
  - Docker Compose setup
  - PostgreSQL database with Sequelize ORM
  - Redis for caching and sessions
  - Environment-based configuration

- **Documentation**
  - README with setup instructions
  - API documentation
  - Architecture overview

### Technical Details
- Flutter state management with BLoC/Cubit pattern
- GoRouter for navigation
- SharedPreferences for settings persistence
- Dio for HTTP requests
- Feature-based project structure
- Sequelize models with associations
- Encrypted OAuth token storage
- Rate limiting middleware
- Comprehensive error handling

---

## Development Notes

### Database Configuration
The backend supports both SQLite (development) and PostgreSQL (production):
- **SQLite**: Works out of the box, data stored in `backend/data/database.sqlite`
- **PostgreSQL**: Set `DATABASE_URL` environment variable

### Running Tests
```bash
cd backend
npm test
```

### Adding API Keys
To enable AI features:
1. Get API keys from OpenAI or Anthropic
2. Add to `backend/.env`:
   ```
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the backend server
