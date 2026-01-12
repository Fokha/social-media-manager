import 'package:dio/dio.dart';
import '../core/constants/app_constants.dart';

class ApiService {
  final Dio _dio;

  ApiService(this._dio);

  // ==================== AUTH ====================
  Future<Response> logout() async {
    return _dio.post('/auth/logout');
  }
  Future<Response> login(String email, String password) async {
    return _dio.post(ApiEndpoints.login, data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> register({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    return _dio.post(ApiEndpoints.register, data: {
      'email': email,
      'password': password,
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
    });
  }

  Future<Response> getCurrentUser() async {
    return _dio.get(ApiEndpoints.me);
  }

  // ==================== ACCOUNTS ====================
  Future<Response> getAccounts() async {
    return _dio.get(ApiEndpoints.accounts);
  }

  Future<Response> getOAuthUrl(String platform) async {
    return _dio.get('/oauth/$platform/url');
  }

  Future<Response> disconnectAccount(String accountId) async {
    return _dio.delete('${ApiEndpoints.accounts}/$accountId');
  }

  Future<Response> updateAccount(String accountId, Map<String, dynamic> data) async {
    return _dio.put('${ApiEndpoints.accounts}/$accountId', data: data);
  }

  Future<Response> getAccountAnalytics(String accountId) async {
    return _dio.get('${ApiEndpoints.accounts}/$accountId/analytics');
  }

  // ==================== POSTS ====================
  Future<Response> getPosts({
    int page = 1,
    int limit = 20,
    String? status,
    String? platform,
  }) async {
    return _dio.get(ApiEndpoints.posts, queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (platform != null) 'platform': platform,
    });
  }

  Future<Response> createPost({
    required String content,
    required List<String> platforms,
    List<String>? mediaUrls,
    String? scheduledAt,
  }) async {
    return _dio.post(ApiEndpoints.posts, data: {
      'content': content,
      'platforms': platforms,
      if (mediaUrls != null) 'mediaUrls': mediaUrls,
      if (scheduledAt != null) 'scheduledAt': scheduledAt,
    });
  }

  Future<Response> updatePost(String postId, Map<String, dynamic> data) async {
    return _dio.put('${ApiEndpoints.posts}/$postId', data: data);
  }

  Future<Response> deletePost(String postId) async {
    return _dio.delete('${ApiEndpoints.posts}/$postId');
  }

  Future<Response> publishPost(String postId) async {
    return _dio.post('${ApiEndpoints.posts}/$postId/publish');
  }

  // ==================== MESSAGES ====================
  Future<Response> getConversations({String? platform}) async {
    return _dio.get(ApiEndpoints.conversations, queryParameters: {
      if (platform != null) 'platform': platform,
    });
  }

  Future<Response> getMessages(String conversationId, {int page = 1}) async {
    return _dio.get('${ApiEndpoints.messages}/conversation/$conversationId', queryParameters: {
      'page': page,
    });
  }

  Future<Response> sendMessage(String conversationId, String content) async {
    return _dio.post('${ApiEndpoints.messages}/send', data: {
      'conversationId': conversationId,
      'content': content,
    });
  }

  Future<Response> markConversationAsRead(String conversationId) async {
    return _dio.post('${ApiEndpoints.messages}/conversation/$conversationId/read');
  }

  Future<Response> getUnreadCount() async {
    return _dio.get('${ApiEndpoints.messages}/unread-count');
  }

  // ==================== SUBSCRIPTION ====================
  Future<Response> getSubscription() async {
    return _dio.get(ApiEndpoints.subscription);
  }

  Future<Response> getPlans() async {
    return _dio.get(ApiEndpoints.plans);
  }

  Future<Response> createCheckoutSession(String planId) async {
    return _dio.post(ApiEndpoints.checkout, data: {'planId': planId});
  }

  Future<Response> cancelSubscription() async {
    return _dio.post('/subscriptions/cancel');
  }

  Future<Response> getUsage() async {
    return _dio.get('/subscriptions/usage');
  }

  Future<Response> getBillingHistory() async {
    return _dio.get('/subscriptions/invoices');
  }

  // ==================== AI ====================
  Future<Response> generateContent({
    required String prompt,
    String? tone,
    int? maxLength,
  }) async {
    return _dio.post(ApiEndpoints.generateContent, data: {
      'prompt': prompt,
      if (tone != null) 'tone': tone,
      if (maxLength != null) 'maxLength': maxLength,
    });
  }

  Future<Response> improveContent(Map<String, dynamic> data) async {
    return _dio.post(ApiEndpoints.improveContent, data: data);
  }

  // ==================== ADMIN ====================
  Future<Response> getAdminStats() async {
    return _dio.get(ApiEndpoints.adminStats);
  }

  Future<Response> getAdminUsers({int page = 1, int limit = 20}) async {
    return _dio.get(ApiEndpoints.adminUsers, queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  Future<Response> updateUserRole(String userId, String role) async {
    return _dio.put('${ApiEndpoints.adminUsers}/$userId/role', data: {'role': role});
  }

  Future<Response> updateUserStatus(String userId, bool isActive) async {
    return _dio.put('${ApiEndpoints.adminUsers}/$userId/status', data: {'isActive': isActive});
  }

  Future<Response> getAdminApiSettings() async {
    return _dio.get('/admin/api-settings');
  }

  Future<Response> updateAdminApiKey(String provider, String apiKey) async {
    return _dio.put('/admin/api-settings/$provider', data: {'apiKey': apiKey});
  }

  Future<Response> getApiUsage({String? startDate, String? endDate}) async {
    return _dio.get(ApiEndpoints.adminApiUsage, queryParameters: {
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
    });
  }

  Future<Response> getAdminBilling() async {
    return _dio.get(ApiEndpoints.adminBilling);
  }

  Future<Response> updateAdminSettings(String key, dynamic value) async {
    return _dio.put('${ApiEndpoints.adminSettings}/$key', data: {'value': value});
  }

  Future<Response> getAdminSettings() async {
    return _dio.get(ApiEndpoints.adminSettings);
  }
}
