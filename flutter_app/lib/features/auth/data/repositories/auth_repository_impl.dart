import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../services/api_service.dart';
import '../../../../services/storage_service.dart';

class AuthRepositoryImpl implements AuthRepository {
  final ApiService _apiService;
  final StorageService _storageService;

  AuthRepositoryImpl(this._apiService, this._storageService);

  @override
  Future<User> login(String email, String password) async {
    final response = await _apiService.login(email, password);
    final data = response.data['data'];

    final user = User.fromJson(data['user']);
    final token = data['token'] as String;

    await _storageService.saveToken(token);
    await _storageService.saveUser(user.toJson());

    return user;
  }

  @override
  Future<User> register({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final response = await _apiService.register(
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
    );
    final data = response.data['data'];

    final user = User.fromJson(data['user']);
    final token = data['token'] as String;

    await _storageService.saveToken(token);
    await _storageService.saveUser(user.toJson());

    return user;
  }

  @override
  Future<User?> getCurrentUser() async {
    try {
      // Fetch fresh data from API
      final response = await _apiService.getCurrentUser();
      final user = User.fromJson(response.data['data']['user']);

      // Update cache
      await _storageService.saveUser(user.toJson());

      return user;
    } catch (e) {
      // If API fails, return cached user
      final cachedUser = await _storageService.getUser();
      if (cachedUser != null) {
        return User.fromJson(cachedUser);
      }
      return null;
    }
  }

  @override
  Future<void> logout() async {
    await _storageService.clearAll();
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await _storageService.getToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<String?> getToken() async {
    return _storageService.getToken();
  }
}
