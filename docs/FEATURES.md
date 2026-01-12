# Features Guide

Comprehensive guide to all features in the Social Media Manager application.

## Table of Contents
- [Dashboard](#dashboard)
- [Find Me](#find-me)
- [Social Accounts](#social-accounts)
- [Post Management](#post-management)
- [AI Content Generation](#ai-content-generation)
- [Messages](#messages)
- [Subscription Plans](#subscription-plans)
- [Settings](#settings)
- [Admin Panel](#admin-panel)

---

## Dashboard

The dashboard provides a complete overview of your social media presence.

### Stats Overview
- **Accounts**: Connected social media accounts count
- **Posts**: Posts created this month
- **Messages**: Unread messages count
- **AI Credits**: AI generation credits used/remaining

### Trending Hashtags
Real-time trending hashtags relevant to your content:
- **Top**: Most popular hashtags
- **Latest**: Recently trending
- **Mentioned**: Hashtags you've been mentioned with

### Recent Mentions
See who's talking about you:
- Platform-specific mentions
- Direct messages
- Comment replies
- Shares and retweets

### Quick Actions
One-click access to common tasks:
- **Create Post**: Start a new post
- **Find Me**: Search for mentions across platforms
- **View Messages**: Check your inbox
- **Add Account**: Connect new platform
- **AI Assistant**: Get AI help

---

## Find Me

Cross-platform social media crawler to discover mentions of your brand.

### How It Works
1. Click "Find Me" in Quick Actions
2. Select platforms to search (Twitter, Instagram, LinkedIn, Facebook)
3. Click "Start Crawling"
4. View results organized by platform and type

### Result Types
- **Mentions**: Direct @mentions of your account
- **Tags**: Posts you've been tagged in
- **Articles**: News/blog articles featuring you
- **Replies**: Conversation threads about you
- **Shares**: Reposts and shares of your content

### Export Options
- Export results as CSV
- Save to analytics dashboard
- Create follow-up tasks

---

## Social Accounts

Connect and manage multiple social media accounts.

### Supported Platforms
| Platform | Features |
|----------|----------|
| **Twitter/X** | Posts, replies, DMs, mentions |
| **Instagram** | Posts, stories, DMs, comments |
| **LinkedIn** | Posts, articles, messages |
| **Facebook** | Posts, pages, messenger |
| **YouTube** | Videos, comments, community posts |
| **Telegram** | Channels, groups, bots |
| **WhatsApp** | Business messaging |
| **GitHub** | Announcements, releases |

### Connecting Accounts
1. Go to **Accounts** page
2. Click **Connect** on desired platform
3. Authorize via OAuth
4. Account appears in connected list

### Account Management
- View account stats
- Disconnect accounts
- Refresh tokens
- Set default posting account

---

## Post Management

Create, schedule, and manage posts across platforms.

### Creating Posts
1. Click **New Post** or go to **Posts > Create**
2. Write your content
3. Add media (images, videos)
4. Select target platforms
5. Choose to post now or schedule

### Post Editor Features
- **Rich text editing**: Format your content
- **Media upload**: Images, videos, GIFs
- **Platform preview**: See how post looks on each platform
- **Character count**: Platform-specific limits
- **AI suggestions**: Get content improvements

### Scheduling
- Set specific date/time
- View calendar of scheduled posts
- Bulk scheduling
- Timezone support

### Post Status
- **Draft**: Saved but not scheduled
- **Scheduled**: Queued for future posting
- **Published**: Successfully posted
- **Failed**: Posting failed (with retry option)

---

## AI Content Generation

AI-powered content creation and improvement.

### Generate Content
```
Input: Topic, platform, tone, length
Output: Platform-optimized content
```

**Options:**
- **Platform**: Twitter, Instagram, LinkedIn, Facebook, YouTube
- **Tone**: Professional, casual, friendly, formal
- **Length**: Short, medium, long
- **Hashtags**: Include/exclude

### Improve Content
Enhance existing content:
- **Make Engaging**: More attention-grabbing
- **Professionalize**: Polish and refine
- **Condense**: Shorter while keeping message
- **Expand**: Add more detail
- **Add Hashtags**: Relevant tags
- **Add CTA**: Call-to-action

### Generate Replies
AI-suggested replies for messages:
- Tone matching
- Context-aware
- Quick customization

### AI Providers
- **OpenAI** (GPT-4)
- **Anthropic** (Claude)
- Demo mode (no API key required)

### Credits System
- Free: 50 credits/month
- Basic: 200 credits/month
- Pro: 500 credits/month
- Business: 2000 credits/month
- Enterprise: Unlimited

---

## Messages

Unified inbox for all social media messages.

### Inbox Features
- **All Messages**: Combined view
- **Platform Filter**: Filter by source
- **Unread**: New messages only
- **Starred**: Important messages

### Message Actions
- Reply (with AI suggestions)
- Mark as read/unread
- Star/unstar
- Archive
- Delete

### Quick Replies
- Save common responses
- AI-generated suggestions
- Template variables

---

## Subscription Plans

Tiered pricing with different feature limits.

### Plan Comparison

| Feature | Free | Basic | Pro | Business | Enterprise |
|---------|------|-------|-----|----------|------------|
| Social Accounts | 2 | 5 | 10 | 25 | Unlimited |
| Posts/Month | 10 | 50 | 200 | 1000 | Unlimited |
| AI Credits | 50 | 200 | 500 | 2000 | Unlimited |
| Scheduled Posts | 5 | 25 | 100 | 500 | Unlimited |
| Team Members | 1 | 2 | 5 | 15 | Unlimited |
| Analytics | Basic | Standard | Advanced | Full | Full |
| Priority Support | ❌ | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ | ✅ | ✅ |

### Upgrading
1. Go to **Subscription** page
2. Select desired plan
3. Enter payment details
4. Instant upgrade

### Usage Tracking
- Real-time usage meters
- Usage alerts at 80% and 100%
- Overage notifications

---

## Settings

Customize your experience.

### Appearance
- **Theme**: Light / Dark mode
- **Language**: Multiple language support
- **Timezone**: For scheduling accuracy

### Notifications
- **Email**: Summary and alerts
- **Push**: Browser notifications
- **In-App**: Activity notifications

### Security
- **Change Password**: Update credentials
- **Two-Factor Auth**: Extra security
- **API Keys**: Manage API access
- **Active Sessions**: View/revoke sessions

### Data
- **Export Data**: Download all your data
- **Delete Account**: Permanent deletion

---

## Admin Panel

Administrative features for platform managers.

### Admin Dashboard
- Total users
- Revenue metrics
- System health
- Active subscriptions

### User Management
- View all users
- Search/filter users
- Edit user details
- Activate/deactivate accounts
- Change user roles

### API Monitoring
- Request statistics
- Error rates
- Response times
- Rate limit status

### Billing Dashboard
- Revenue overview
- Subscription analytics
- Payment history
- Refund management

### Access Control
- Role-based permissions
- Admin/User mode toggle
- Audit logging

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New post |
| `Ctrl/Cmd + S` | Save draft |
| `Ctrl/Cmd + Enter` | Publish/Schedule |
| `Ctrl/Cmd + /` | AI assistant |
| `Esc` | Close modal |

---

## Mobile App

The Flutter app works on iOS and Android with full feature parity:

- Native performance
- Push notifications
- Offline draft saving
- Camera integration
- Share extension

### Download
- iOS: App Store (coming soon)
- Android: Google Play (coming soon)
- Web: https://your-domain.vercel.app
