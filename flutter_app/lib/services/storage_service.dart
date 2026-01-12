import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';

class StorageService {
  final SharedPreferences _prefs;
  final FlutterSecureStorage _secureStorage;

  StorageService(this._prefs, this._secureStorage);

  // ==================== SECURE STORAGE (Sensitive Data) ====================

  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return _secureStorage.read(key: AppConstants.tokenKey);
  }

  Future<void> deleteToken() async {
    await _secureStorage.delete(key: AppConstants.tokenKey);
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    await _secureStorage.write(
      key: AppConstants.userKey,
      value: jsonEncode(user),
    );
  }

  Future<Map<String, dynamic>?> getUser() async {
    final userJson = await _secureStorage.read(key: AppConstants.userKey);
    if (userJson != null) {
      return jsonDecode(userJson) as Map<String, dynamic>;
    }
    return null;
  }

  Future<void> deleteUser() async {
    await _secureStorage.delete(key: AppConstants.userKey);
  }

  Future<void> clearSecureStorage() async {
    await _secureStorage.deleteAll();
  }

  // ==================== SHARED PREFERENCES (Non-Sensitive Data) ====================

  Future<void> setThemeMode(String mode) async {
    await _prefs.setString(AppConstants.themeKey, mode);
  }

  String? getThemeMode() {
    return _prefs.getString(AppConstants.themeKey);
  }

  Future<void> setBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  String? getString(String key) {
    return _prefs.getString(key);
  }

  Future<void> setInt(String key, int value) async {
    await _prefs.setInt(key, value);
  }

  int? getInt(String key) {
    return _prefs.getInt(key);
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  Future<void> clearPreferences() async {
    await _prefs.clear();
  }

  // ==================== CLEAR ALL ====================

  Future<void> clearAll() async {
    await clearSecureStorage();
    await clearPreferences();
  }
}
