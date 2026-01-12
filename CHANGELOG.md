# Changelog

All notable changes to this project will be documented in this file.

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

### Running in Demo Mode
The app runs in demo mode when:
- No authentication token is provided
- No OpenAI/Anthropic API keys are configured

Demo mode features:
- Pro subscription with full features
- Mock AI responses for content generation
- All UI features functional

### Adding API Keys
To enable real AI generation:
1. Get API keys from OpenAI or Anthropic
2. Add to `backend/.env`:
   ```
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the backend server
