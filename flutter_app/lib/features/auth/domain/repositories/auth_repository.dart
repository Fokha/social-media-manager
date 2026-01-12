import '../entities/user.dart';

abstract class AuthRepository {
  Future<User> login(String email, String password);
  Future<User> register({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  });
  Future<User?> getCurrentUser();
  Future<void> logout();
  Future<bool> isLoggedIn();
  Future<String?> getToken();
}
