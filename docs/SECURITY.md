# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email security concerns to: security@socialmanager.com
3. Include detailed description and steps to reproduce
4. Allow up to 48 hours for initial response

## Security Measures

### Authentication
- JWT tokens with configurable expiration
- Password hashing using bcrypt (12 rounds)
- Rate limiting on authentication endpoints
- Session invalidation on logout

### Data Protection
- OAuth tokens encrypted at rest (AES-256)
- HTTPS enforced in production
- SQL injection prevention via Sequelize ORM
- XSS protection via input sanitization

### API Security
- CORS configuration for allowed origins
- Rate limiting (100 requests/15 minutes per IP)
- Request validation with Joi
- Helmet.js security headers

### Infrastructure
- Environment variables for secrets
- No secrets in code repository
- Database connection encryption
- Redis password authentication

## Security Headers

The following headers are set via Helmet.js:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## Best Practices for Deployment

1. **Environment Variables**
   - Never commit `.env` files
   - Use secrets management in production
   - Rotate JWT secrets periodically

2. **Database**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

3. **Monitoring**
   - Enable logging
   - Set up alerts for suspicious activity
   - Monitor failed login attempts

4. **Updates**
   - Keep dependencies updated
   - Run `npm audit` regularly
   - Apply security patches promptly

## Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection (for web forms)
- [ ] Logging enabled
- [ ] Error messages don't leak sensitive info
