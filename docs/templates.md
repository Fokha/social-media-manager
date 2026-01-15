# Unified Templates Documentation

This document describes the reusable CRUD and OAuth templates that form the core of the Social Media Manager application.

## Table of Contents

1. [Backend CRUD Template](#backend-crud-template)
2. [Backend CRUD Routes](#backend-crud-routes)
3. [Frontend CRUD Hooks](#frontend-crud-hooks)
4. [Backend OAuth Template](#backend-oauth-template)
5. [Frontend OAuth Hooks](#frontend-oauth-hooks)

---

## Backend CRUD Template

**Location:** `backend/src/templates/BaseCRUD.js`

### Overview

A unified base class for Create, Read, Update, Delete operations on any Sequelize model.

### Quick Start

```javascript
const BaseCRUD = require('./templates/BaseCRUD');
const { Post } = require('./models');

// Option 1: Create instance directly
const PostService = BaseCRUD.create(Post, {
  searchFields: ['content', 'title'],
  defaultSort: [['createdAt', 'DESC']],
  allowedFilters: ['status', 'platform'],
});

// Option 2: Extend the class
class PostService extends BaseCRUD {
  constructor() {
    super(Post, {
      searchFields: ['content', 'title'],
      defaultSort: [['createdAt', 'DESC']],
    });
  }

  // Add custom methods
  async findByPlatform(platform) {
    return this.findByField('platform', platform);
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `searchFields` | `string[]` | `[]` | Fields to search in findAll |
| `defaultSort` | `Array` | `[['createdAt', 'DESC']]` | Default sorting |
| `allowedFilters` | `string[]` | `[]` | Fields that can be filtered |
| `defaultIncludes` | `Object[]` | `[]` | Default associations to include |
| `excludeFields` | `string[]` | `['password']` | Fields to exclude from responses |
| `softDelete` | `boolean` | `false` | Enable soft delete |

### Available Methods

#### Create Operations
- `create(data, options)` - Create a single record
- `createMany(dataArray, options)` - Create multiple records

#### Read Operations
- `findAll(params)` - List with pagination, search, filters
- `findById(id, options)` - Find by primary key
- `findOne(where, options)` - Find by conditions
- `findByField(field, value, options)` - Find by specific field
- `count(where)` - Count records
- `exists(where)` - Check if record exists

#### Update Operations
- `update(id, data, options)` - Update single record
- `updateMany(where, data, options)` - Update multiple records
- `upsert(where, data, options)` - Update or create

#### Delete Operations
- `delete(id, options)` - Delete single record
- `deleteMany(where, options)` - Delete multiple records
- `restore(id)` - Restore soft-deleted record

### Example Usage

```javascript
// List with pagination and search
const result = await PostService.findAll({
  page: 1,
  limit: 20,
  search: 'hello world',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  filters: { status: 'published' },
});

// Create
const post = await PostService.create({
  content: 'Hello World!',
  platform: 'twitter',
});

// Update
const updated = await PostService.update(postId, {
  content: 'Updated content',
});

// Delete
const success = await PostService.delete(postId);
```

---

## Backend CRUD Routes

**Location:** `backend/src/templates/CRUDRoutes.js`

### Overview

Generates Express routes for any CRUD service with authentication and ownership support.

### Quick Start

```javascript
const router = require('express').Router();
const CRUDRoutes = require('./templates/CRUDRoutes');
const PostService = require('./services/PostService');
const { authenticate } = require('./middleware/auth');

// Generate all routes at once
CRUDRoutes.generate(router, PostService, {
  middleware: [authenticate],
  ownerField: 'userId',
  exclude: ['delete'], // Optional: skip certain routes
});

// Or generate individual routes
CRUDRoutes.listRoute(router, PostService, { middleware: [authenticate] });
CRUDRoutes.getRoute(router, PostService, { middleware: [authenticate] });
CRUDRoutes.createRoute(router, PostService, { middleware: [authenticate] });

module.exports = router;
```

### Generated Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all records with pagination |
| GET | `/:id` | Get single record by ID |
| POST | `/` | Create new record |
| PUT | `/:id` | Update record by ID |
| DELETE | `/:id` | Delete record by ID |

### Bulk Routes (Optional)

```javascript
CRUDRoutes.bulkRoutes(router, PostService, { middleware: [authenticate] });
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/bulk` | Create multiple records |
| DELETE | `/bulk` | Delete multiple records |

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `middleware` | `Function[]` | Express middleware (auth, validation, etc.) |
| `ownerField` | `string` | Field to filter by `req.user.id` |
| `exclude` | `string[]` | Routes to skip (`list`, `get`, `create`, `update`, `delete`) |

---

## Frontend CRUD Hooks

**Location:** `frontend/src/templates/useCRUD.js`

### Overview

React Query hooks for any CRUD resource with automatic cache invalidation.

### Quick Start

```javascript
import { createCRUDHooks, createAPIService } from '../templates/useCRUD';
import axios from '../services/axios';

// Create API service
const postsAPI = createAPIService(axios, '/posts');

// Create hooks
const postsHooks = createCRUDHooks('posts', { api: postsAPI });

// Use in component
function PostsList() {
  const { data, isLoading } = postsHooks.useList({ page: 1, limit: 20 });
  const { mutate: createPost } = postsHooks.useCreate();
  const { mutate: deletePost } = postsHooks.useDelete();

  if (isLoading) return <Loading />;

  return (
    <div>
      {data?.posts?.map(post => (
        <PostCard key={post.id} post={post} onDelete={() => deletePost(post.id)} />
      ))}
    </div>
  );
}
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `useList(params, options)` | List with pagination, search, filters |
| `useGet(id, options)` | Get single item by ID |
| `useCreate(options)` | Create mutation |
| `useUpdate(options)` | Update mutation |
| `useDelete(options)` | Delete mutation |
| `useBulkDelete(options)` | Bulk delete mutation |
| `useOptimisticUpdate(queryType, updateFn, options)` | Optimistic updates |
| `usePrefetchList(params)` | Prefetch list data |
| `usePrefetchItem(id)` | Prefetch single item |
| `useInvalidate()` | Invalidate all queries |

### Pagination Helper

```javascript
import { usePagination } from '../templates/useCRUD';

function PaginatedList() {
  const { page, limit, nextPage, prevPage, params } = usePagination(1, 20);
  const { data } = postsHooks.useList(params);

  return (
    <div>
      {/* list content */}
      <button onClick={prevPage}>Previous</button>
      <button onClick={nextPage}>Next</button>
    </div>
  );
}
```

---

## Backend OAuth Template

**Location:** `backend/src/templates/BaseOAuth.js`

### Overview

Unified OAuth2 flow handler for any social media platform with PKCE support.

### Quick Start

```javascript
const BaseOAuth = require('./templates/BaseOAuth');

// Option 1: Use preset
const TwitterOAuth = BaseOAuth.fromPreset('twitter', {
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/api/oauth/twitter/callback',
});

// Option 2: Custom configuration
const CustomOAuth = BaseOAuth.create({
  platform: 'custom',
  authUrl: 'https://custom.com/oauth/authorize',
  tokenUrl: 'https://custom.com/oauth/token',
  userInfoUrl: 'https://api.custom.com/me',
  scopes: ['read', 'write'],
  clientId: process.env.CUSTOM_CLIENT_ID,
  clientSecret: process.env.CUSTOM_CLIENT_SECRET,
  usePKCE: true,
});

// In routes
router.get('/twitter/auth', TwitterOAuth.initiateAuth);
router.get('/twitter/callback', TwitterOAuth.handleCallback, saveAccountHandler);
```

### Available Presets

- `twitter` - Twitter OAuth2 with PKCE
- `instagram` - Instagram Basic Display API
- `linkedin` - LinkedIn OAuth2
- `youtube` - Google/YouTube OAuth2
- `github` - GitHub OAuth

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `platform` | `string` | required | Platform identifier |
| `authUrl` | `string` | required | Authorization URL |
| `tokenUrl` | `string` | required | Token exchange URL |
| `userInfoUrl` | `string` | - | User info endpoint |
| `scopes` | `string[]` | `[]` | Required OAuth scopes |
| `clientId` | `string` | required | OAuth client ID |
| `clientSecret` | `string` | required | OAuth client secret |
| `redirectUri` | `string` | - | Callback URI (auto-generated if not set) |
| `usePKCE` | `boolean` | `false` | Use PKCE for security |
| `useBasicAuth` | `boolean` | `false` | Use Basic auth header |
| `extraParams` | `Object` | `{}` | Additional auth params |
| `transformUserInfo` | `Function` | - | Transform user info response |

### Methods

| Method | Description |
|--------|-------------|
| `initiateAuth(req, res)` | Express middleware to start OAuth flow |
| `handleCallback(req, res, next)` | Express middleware to handle callback |
| `refreshToken(refreshToken)` | Refresh an expired access token |
| `encryptToken(token)` | Encrypt token for secure storage |
| `decryptToken(encryptedToken)` | Decrypt stored token |
| `isTokenExpired(expiresAt)` | Check if token is expired |

---

## Frontend OAuth Hooks

**Location:** `frontend/src/templates/useOAuth.js`

### Overview

React hooks for OAuth authentication flows with popup and redirect support.

### Quick Start

```javascript
import { useOAuth, ConnectPlatformButton } from '../templates/useOAuth';

// Hook usage
function ConnectAccount() {
  const { connect, isConnecting, error } = useOAuth('twitter', {
    popup: true,
    onSuccess: (account) => console.log('Connected:', account),
    onError: (error) => console.error('Failed:', error),
  });

  return (
    <button onClick={connect} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect Twitter'}
    </button>
  );
}

// Component usage
function AccountsPage() {
  return (
    <div>
      <ConnectPlatformButton platform="twitter" onSuccess={refetchAccounts} />
      <ConnectPlatformButton platform="instagram" onSuccess={refetchAccounts} />
    </div>
  );
}
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `useOAuth(platform, options)` | Initiate OAuth flow |
| `useOAuthCallback()` | Handle OAuth callback page |
| `useConnectedAccounts()` | Manage connected accounts |

### Components

| Component | Description |
|-----------|-------------|
| `OAuthCallbackHandler` | Ready-to-use callback page component |
| `ConnectPlatformButton` | Styled connect button for any platform |

### Supported Platforms

- Twitter
- Instagram
- LinkedIn
- YouTube
- GitHub
- Telegram
- WhatsApp
- Snapchat

### OAuth Callback Page Example

```javascript
// pages/oauth/callback.js
import { OAuthCallbackHandler } from '../../templates/useOAuth';

export default function OAuthCallback() {
  return (
    <OAuthCallbackHandler
      onSuccess={(account) => console.log('Connected:', account)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  useOAuth  │  useCRUD  │  Components  │  Pages              │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│                  REST API / Express                          │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  BaseOAuth  │  CRUDRoutes  │  BaseCRUD  │  Models           │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database                               │
├─────────────────────────────────────────────────────────────┤
│                    SQLite / PostgreSQL                       │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Always use the templates** - They provide consistent error handling, validation, and security.

2. **Configure ownership** - Use `ownerField` to automatically filter by user ID.

3. **Use soft delete for production** - Enable `softDelete: true` for data recovery.

4. **Encrypt tokens** - Use `encryptToken()` before storing OAuth tokens.

5. **Invalidate cache** - The frontend hooks automatically invalidate related queries.

6. **Handle errors gracefully** - Both templates include comprehensive error handling.
