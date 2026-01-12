# Contributing Guide

Thank you for your interest in contributing to Social Media Manager!

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- No harassment or discrimination

---

## Getting Started

### 1. Fork the Repository
Click "Fork" on GitHub to create your own copy.

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR_USERNAME/social-media-manager.git
cd social-media-manager
```

### 3. Add Upstream Remote
```bash
git remote add upstream https://github.com/Fokha/social-media-manager.git
```

### 4. Set Up Development Environment
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your local settings

# Flutter
cd ../flutter_app
flutter pub get
```

### 5. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

---

## Development Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test additions

### Keep Your Fork Updated
```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## Code Style

### Flutter/Dart
- Follow [Effective Dart](https://dart.dev/guides/language/effective-dart)
- Use `flutter analyze` before committing
- Format with `dart format`

```dart
// Good
class UserService {
  final ApiClient _client;

  UserService(this._client);

  Future<User> getUser(String id) async {
    final response = await _client.get('/users/$id');
    return User.fromJson(response.data);
  }
}

// Bad
class userService {
  var client;
  getUser(id) async {
    var response = await client.get('/users/' + id);
    return User.fromJson(response.data);
  }
}
```

### JavaScript/Node.js
- Use ES6+ features
- Async/await over callbacks
- Use `const` by default, `let` when needed

```javascript
// Good
const getUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

// Bad
function getUser(id, callback) {
  User.findByPk(id).then(function(user) {
    callback(null, user);
  }).catch(function(err) {
    callback(err);
  });
}
```

---

## Commit Guidelines

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(posts): add bulk scheduling feature

- Add date range picker
- Implement queue processing
- Add progress indicator

Closes #123
```

```
fix(auth): resolve token refresh race condition
```

```
docs(api): update authentication endpoints
```

---

## Pull Request Process

### 1. Before Submitting
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Linked to issue (if applicable)

### 2. PR Title
Same format as commit messages:
```
feat(scope): brief description
```

### 3. PR Description Template
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added comments for complex logic
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
```

### 4. Review Process
1. Automated checks must pass
2. At least one maintainer approval
3. Address review feedback
4. Squash commits if requested

---

## Testing

### Backend Tests
```bash
cd backend
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Flutter Tests
```bash
cd flutter_app

# Unit tests
flutter test

# Widget tests
flutter test --tags widget

# Integration tests
flutter test integration_test/
```

### Writing Tests

**Backend (Jest):**
```javascript
describe('AuthController', () => {
  describe('POST /login', () => {
    it('should return token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
    });
  });
});
```

**Flutter (widget test):**
```dart
testWidgets('LoginPage shows error for invalid email', (tester) async {
  await tester.pumpWidget(MaterialApp(home: LoginPage()));

  await tester.enterText(find.byType(TextField).first, 'invalid');
  await tester.tap(find.text('Login'));
  await tester.pump();

  expect(find.text('Invalid email'), findsOneWidget);
});
```

---

## Documentation

### Code Documentation
- Add JSDoc/DartDoc for public APIs
- Explain complex logic with comments
- Keep README files updated

### API Documentation
Update `docs/API.md` for endpoint changes.

### User Documentation
Update `docs/FEATURES.md` for feature changes.

---

## Issue Templates

### Bug Report
```markdown
**Describe the bug**
Clear description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable.

**Environment:**
- OS: [e.g., macOS, Windows]
- Browser: [e.g., Chrome, Safari]
- Version: [e.g., 1.0.0]
```

### Feature Request
```markdown
**Is your feature request related to a problem?**
Description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other information.
```

---

## Questions?

- Open a [GitHub Discussion](https://github.com/Fokha/social-media-manager/discussions)
- Check existing issues
- Review documentation

Thank you for contributing! 🎉
