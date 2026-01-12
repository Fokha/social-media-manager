# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

In demo mode (no token provided), a demo user is automatically used.

---

## Auth Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "token": "jwt-token"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

---

## Accounts Endpoints

### List Connected Accounts
```http
GET /accounts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "uuid",
        "platform": "twitter",
        "username": "@johndoe",
        "isActive": true
      }
    ]
  }
}
```

### Connect Platform
```http
POST /accounts/connect/:platform
Authorization: Bearer <token>
```

Redirects to OAuth flow for the specified platform.

### Disconnect Account
```http
DELETE /accounts/:id
Authorization: Bearer <token>
```

---

## Posts Endpoints

### List Posts
```http
GET /posts?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": { "total": 50, "page": 1, "pages": 5 }
  }
}
```

### Create Post
```http
POST /posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello world!",
  "platforms": ["twitter", "instagram"],
  "scheduledAt": "2024-01-15T10:00:00Z",
  "mediaUrls": []
}
```

### Update Post
```http
PUT /posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content",
  "scheduledAt": "2024-01-16T10:00:00Z"
}
```

### Delete Post
```http
DELETE /posts/:id
Authorization: Bearer <token>
```

---

## AI Endpoints

### Generate Content
```http
POST /ai/generate-content
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "Social media marketing tips",
  "platform": "twitter",
  "tone": "professional",
  "length": "medium",
  "includeHashtags": true,
  "provider": "openai"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "Generated content here...",
    "creditsUsed": 1,
    "creditsRemaining": 49
  }
}
```

### Improve Content
```http
POST /ai/improve-content
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Original content to improve",
  "platform": "linkedin",
  "improvementType": "engaging"
}
```

**Improvement Types:**
- `engaging` - Make more attention-grabbing
- `professional` - Make more polished
- `concise` - Shorten while keeping message
- `expand` - Add more detail
- `hashtags` - Add relevant hashtags
- `cta` - Add call-to-action

### Generate Reply
```http
POST /ai/generate-reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Customer message here",
  "context": "Customer support",
  "tone": "friendly"
}
```

**Tones:** `friendly`, `professional`, `casual`, `formal`

### Get Hashtag Suggestions
```http
POST /ai/hashtag-suggestions
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Post content",
  "platform": "instagram",
  "count": 10
}
```

---

## Messages Endpoints

### List Messages
```http
GET /messages?page=1&limit=20
Authorization: Bearer <token>
```

### Get Unread Count
```http
GET /messages/unread-count
Authorization: Bearer <token>
```

### Reply to Message
```http
POST /messages/:id/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Reply content"
}
```

### Mark as Read
```http
PUT /messages/:id/read
Authorization: Bearer <token>
```

---

## Subscriptions Endpoints

### Get Usage Stats
```http
GET /subscriptions/usage
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "accounts": 2,
      "postsThisMonth": 15,
      "aiCreditsUsed": 10
    },
    "limits": {
      "accounts": 5,
      "postsPerMonth": 50,
      "aiCredits": 100
    },
    "plan": "basic"
  }
}
```

### Upgrade Plan
```http
POST /subscriptions/upgrade
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "pro",
  "paymentMethodId": "pm_xxx"
}
```

---

## Admin Endpoints

All admin endpoints require admin role.

### List Users
```http
GET /admin/users?page=1&limit=20
Authorization: Bearer <admin-token>
```

### Update User
```http
PUT /admin/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "isActive": false,
  "role": "user"
}
```

### Get Stats
```http
GET /admin/stats
Authorization: Bearer <admin-token>
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "stack": "Stack trace (development only)"
}
```

**Common Status Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error
