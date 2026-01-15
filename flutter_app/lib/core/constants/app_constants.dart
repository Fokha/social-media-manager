class AppConstants {
  AppConstants._();

  static const String appName = 'Social Media Manager';
  static const String appVersion = '1.0.0';

  // API
  static const String baseUrl = 'http://145.241.106.50:3000/api';
  static const String socketUrl = 'http://145.241.106.50:3000';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';

  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Pagination
  static const int defaultPageSize = 20;

  // Animation Durations
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const Duration splashDuration = Duration(seconds: 2);
}

class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';
  static const String logout = '/auth/logout';

  // Accounts
  static const String accounts = '/accounts';
  static const String connectAccount = '/oauth';

  // Posts
  static const String posts = '/posts';
  static const String publishPost = '/posts/{id}/publish';

  // Messages
  static const String messages = '/messages';
  static const String conversations = '/messages/conversations';

  // Subscriptions
  static const String subscription = '/subscriptions/current';
  static const String plans = '/subscriptions/plans';
  static const String checkout = '/subscriptions/create-checkout';

  // AI
  static const String generateContent = '/ai/generate-content';
  static const String improveContent = '/ai/improve-content';

  // Admin
  static const String adminStats = '/admin/stats';
  static const String adminUsers = '/admin/users';
  static const String adminApiUsage = '/admin/api-usage';
  static const String adminBilling = '/admin/billing';
  static const String adminSettings = '/admin/settings';
}
