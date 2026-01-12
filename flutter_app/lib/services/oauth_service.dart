// OAuth Service Template for Social Media Manager
// Supports: Google, Apple, Microsoft (Azure AD), Email/Password
// Compatible with: iOS, Android, Web, macOS

import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

// ============================================================================
// OAUTH CONFIGURATION
// ============================================================================

/// OAuth provider configuration constants
class OAuthConfig {
  // Google OAuth - Get from Google Cloud Console
  // https://console.cloud.google.com/apis/credentials
  static const String googleClientIdIOS =
      'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
  static const String googleClientIdAndroid =
      'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
  static const String googleClientIdWeb =
      'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

  // Apple Sign-In - Configure in Apple Developer Portal
  // https://developer.apple.com/account/resources/identifiers
  static const String appleServiceId = 'com.yourapp.service';
  static const String appleRedirectUri =
      'https://your-backend.com/auth/apple/callback';

  // Microsoft/Azure AD - Get from Azure Portal
  // https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
  static const String microsoftClientId = 'YOUR_AZURE_CLIENT_ID';
  static const String microsoftTenantId = 'common'; // or specific tenant
  static const String microsoftRedirectUri =
      'msauth://com.yourapp/callback'; // or custom scheme

  // Scopes
  static const List<String> googleScopes = [
    'email',
    'profile',
    'openid',
  ];

  static const List<String> microsoftScopes = [
    'openid',
    'profile',
    'email',
    'User.Read',
  ];

  // Backend API endpoints
  static const String backendBaseUrl = 'http://localhost:3000/api';
  static const String authEndpoint = '/auth';
  static const String socialLoginEndpoint = '/auth/social';
  static const String refreshTokenEndpoint = '/auth/refresh';

  /// Get the appropriate Google client ID for the current platform
  static String get googleClientId {
    if (kIsWeb) return googleClientIdWeb;
    if (Platform.isIOS || Platform.isMacOS) return googleClientIdIOS;
    return googleClientIdAndroid;
  }
}

// ============================================================================
// AUTH USER MODEL
// ============================================================================

/// Authentication provider types
enum AuthProvider {
  email,
  google,
  apple,
  microsoft,
}

/// Unified authentication user model
class OAuthUser {
  final String id;
  final String email;
  final String? displayName;
  final String? firstName;
  final String? lastName;
  final String? photoUrl;
  final AuthProvider provider;
  final String? accessToken;
  final String? refreshToken;
  final String? idToken;
  final DateTime? tokenExpiry;
  final Map<String, dynamic>? providerData;

  const OAuthUser({
    required this.id,
    required this.email,
    this.displayName,
    this.firstName,
    this.lastName,
    this.photoUrl,
    required this.provider,
    this.accessToken,
    this.refreshToken,
    this.idToken,
    this.tokenExpiry,
    this.providerData,
  });

  /// Full name from first and last name or display name
  String get fullName {
    if (firstName != null || lastName != null) {
      return [firstName, lastName].whereType<String>().join(' ').trim();
    }
    return displayName ?? email.split('@').first;
  }

  /// Check if token is expired
  bool get isTokenExpired {
    if (tokenExpiry == null) return true;
    return DateTime.now().isAfter(tokenExpiry!);
  }

  /// Create from JSON
  factory OAuthUser.fromJson(Map<String, dynamic> json) {
    return OAuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      provider: AuthProvider.values.firstWhere(
        (e) => e.name == (json['provider'] as String? ?? 'email'),
        orElse: () => AuthProvider.email,
      ),
      accessToken: json['accessToken'] as String?,
      refreshToken: json['refreshToken'] as String?,
      idToken: json['idToken'] as String?,
      tokenExpiry: json['tokenExpiry'] != null
          ? DateTime.parse(json['tokenExpiry'] as String)
          : null,
      providerData: json['providerData'] as Map<String, dynamic>?,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'firstName': firstName,
      'lastName': lastName,
      'photoUrl': photoUrl,
      'provider': provider.name,
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'idToken': idToken,
      'tokenExpiry': tokenExpiry?.toIso8601String(),
      'providerData': providerData,
    };
  }

  /// Create a copy with updated fields
  OAuthUser copyWith({
    String? id,
    String? email,
    String? displayName,
    String? firstName,
    String? lastName,
    String? photoUrl,
    AuthProvider? provider,
    String? accessToken,
    String? refreshToken,
    String? idToken,
    DateTime? tokenExpiry,
    Map<String, dynamic>? providerData,
  }) {
    return OAuthUser(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      photoUrl: photoUrl ?? this.photoUrl,
      provider: provider ?? this.provider,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      idToken: idToken ?? this.idToken,
      tokenExpiry: tokenExpiry ?? this.tokenExpiry,
      providerData: providerData ?? this.providerData,
    );
  }
}

// ============================================================================
// OAUTH SERVICE
// ============================================================================

/// OAuth authentication result
class OAuthResult {
  final bool success;
  final OAuthUser? user;
  final String? error;
  final String? errorCode;

  const OAuthResult({
    required this.success,
    this.user,
    this.error,
    this.errorCode,
  });

  factory OAuthResult.success(OAuthUser user) {
    return OAuthResult(success: true, user: user);
  }

  factory OAuthResult.failure(String error, {String? errorCode}) {
    return OAuthResult(success: false, error: error, errorCode: errorCode);
  }
}

/// Core OAuth service handling all authentication providers
class OAuthService {
  static OAuthService? _instance;
  static OAuthService get instance => _instance ??= OAuthService._();

  OAuthService._();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  // Google Sign In instance
  GoogleSignIn? _googleSignIn;

  // Storage keys
  static const String _userKey = 'oauth_user';
  static const String _tokenKey = 'oauth_token';
  static const String _refreshTokenKey = 'oauth_refresh_token';

  // Current user
  OAuthUser? _currentUser;
  OAuthUser? get currentUser => _currentUser;

  // Auth state stream
  final StreamController<OAuthUser?> _authStateController =
      StreamController<OAuthUser?>.broadcast();
  Stream<OAuthUser?> get authStateChanges => _authStateController.stream;

  /// Initialize OAuth service
  Future<void> initialize() async {
    // Initialize Google Sign In
    _googleSignIn = GoogleSignIn(
      clientId: OAuthConfig.googleClientId,
      scopes: OAuthConfig.googleScopes,
    );

    // Restore saved user
    await _restoreUser();
  }

  /// Restore user from secure storage
  Future<void> _restoreUser() async {
    try {
      final userData = await _secureStorage.read(key: _userKey);
      if (userData != null) {
        _currentUser = OAuthUser.fromJson(jsonDecode(userData));
        _authStateController.add(_currentUser);
      }
    } catch (e) {
      debugPrint('Failed to restore user: $e');
    }
  }

  /// Save user to secure storage
  Future<void> _saveUser(OAuthUser user) async {
    _currentUser = user;
    await _secureStorage.write(
      key: _userKey,
      value: jsonEncode(user.toJson()),
    );
    if (user.accessToken != null) {
      await _secureStorage.write(key: _tokenKey, value: user.accessToken);
    }
    if (user.refreshToken != null) {
      await _secureStorage.write(
          key: _refreshTokenKey, value: user.refreshToken);
    }
    _authStateController.add(user);
  }

  /// Clear user data
  Future<void> _clearUser() async {
    _currentUser = null;
    await _secureStorage.delete(key: _userKey);
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    _authStateController.add(null);
  }

  // ===========================================================================
  // GOOGLE SIGN IN
  // ===========================================================================

  /// Sign in with Google
  Future<OAuthResult> signInWithGoogle() async {
    try {
      final googleSignIn = _googleSignIn;
      if (googleSignIn == null) {
        return OAuthResult.failure('Google Sign In not initialized');
      }

      // Trigger sign in flow
      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();

      if (googleUser == null) {
        return OAuthResult.failure('Sign in cancelled', errorCode: 'cancelled');
      }

      // Get authentication details
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Create user object
      final user = OAuthUser(
        id: googleUser.id,
        email: googleUser.email,
        displayName: googleUser.displayName,
        photoUrl: googleUser.photoUrl,
        provider: AuthProvider.google,
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
        tokenExpiry: DateTime.now().add(const Duration(hours: 1)),
        providerData: {
          'serverAuthCode': googleUser.serverAuthCode,
        },
      );

      // Save user
      await _saveUser(user);

      return OAuthResult.success(user);
    } catch (e) {
      debugPrint('Google sign in error: $e');
      return OAuthResult.failure('Failed to sign in with Google: $e');
    }
  }

  /// Check if user is signed in with Google
  Future<bool> isGoogleSignedIn() async {
    return await _googleSignIn?.isSignedIn() ?? false;
  }

  /// Silently sign in with Google (restore session)
  Future<OAuthResult> signInWithGoogleSilently() async {
    try {
      final googleUser = await _googleSignIn?.signInSilently();
      if (googleUser == null) {
        return OAuthResult.failure('No previous Google session');
      }

      final googleAuth = await googleUser.authentication;

      final user = OAuthUser(
        id: googleUser.id,
        email: googleUser.email,
        displayName: googleUser.displayName,
        photoUrl: googleUser.photoUrl,
        provider: AuthProvider.google,
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
        tokenExpiry: DateTime.now().add(const Duration(hours: 1)),
      );

      await _saveUser(user);
      return OAuthResult.success(user);
    } catch (e) {
      return OAuthResult.failure('Silent sign in failed: $e');
    }
  }

  // ===========================================================================
  // APPLE SIGN IN
  // ===========================================================================

  /// Sign in with Apple
  /// Requires sign_in_with_apple package and proper Apple Developer setup
  Future<OAuthResult> signInWithApple() async {
    try {
      // Check platform support
      if (!kIsWeb && !Platform.isIOS && !Platform.isMacOS) {
        // For Android/other platforms, use web-based Apple sign in
        return await _signInWithAppleWeb();
      }

      // Native Apple Sign In (iOS/macOS)
      // NOTE: Uncomment after adding sign_in_with_apple to pubspec.yaml
      // final credential = await SignInWithApple.getAppleIDCredential(
      //   scopes: [
      //     AppleIDAuthorizationScopes.email,
      //     AppleIDAuthorizationScopes.fullName,
      //   ],
      //   webAuthenticationOptions: WebAuthenticationOptions(
      //     clientId: OAuthConfig.appleServiceId,
      //     redirectUri: Uri.parse(OAuthConfig.appleRedirectUri),
      //   ),
      // );
      //
      // final user = OAuthUser(
      //   id: credential.userIdentifier ?? '',
      //   email: credential.email ?? '',
      //   firstName: credential.givenName,
      //   lastName: credential.familyName,
      //   provider: AuthProvider.apple,
      //   idToken: credential.identityToken,
      //   accessToken: credential.authorizationCode,
      //   providerData: {
      //     'state': credential.state,
      //   },
      // );
      //
      // await _saveUser(user);
      // return OAuthResult.success(user);

      // Demo mode - return mock result
      return _mockAppleSignIn();
    } catch (e) {
      debugPrint('Apple sign in error: $e');
      return OAuthResult.failure('Failed to sign in with Apple: $e');
    }
  }

  /// Web-based Apple Sign In for non-Apple platforms
  Future<OAuthResult> _signInWithAppleWeb() async {
    // Implement OAuth web flow for Apple on Android/Web
    // This requires a backend server to handle the OAuth callback

    // Demo mode - return mock result
    return _mockAppleSignIn();
  }

  /// Mock Apple Sign In for demo/development
  OAuthResult _mockAppleSignIn() {
    final user = OAuthUser(
      id: 'apple_demo_${DateTime.now().millisecondsSinceEpoch}',
      email: 'demo@icloud.com',
      displayName: 'Apple User',
      provider: AuthProvider.apple,
      accessToken: 'demo_apple_token',
      tokenExpiry: DateTime.now().add(const Duration(hours: 1)),
    );
    _saveUser(user);
    return OAuthResult.success(user);
  }

  // ===========================================================================
  // MICROSOFT SIGN IN
  // ===========================================================================

  /// Sign in with Microsoft (Azure AD)
  /// Requires msal_flutter package
  Future<OAuthResult> signInWithMicrosoft() async {
    try {
      // NOTE: Uncomment after adding msal_flutter to pubspec.yaml
      // final pca = await PublicClientApplication.createPublicClientApplication(
      //   OAuthConfig.microsoftClientId,
      //   authority: 'https://login.microsoftonline.com/${OAuthConfig.microsoftTenantId}',
      // );
      //
      // final result = await pca.acquireToken(
      //   AcquireTokenInteractiveParameters(
      //     scopes: OAuthConfig.microsoftScopes,
      //   ),
      // );
      //
      // if (result == null) {
      //   return OAuthResult.failure('Microsoft sign in cancelled');
      // }
      //
      // // Parse ID token to get user info
      // final claims = result.account?.claims ?? {};
      //
      // final user = OAuthUser(
      //   id: result.account?.homeAccountId ?? '',
      //   email: claims['email'] as String? ?? claims['preferred_username'] as String? ?? '',
      //   displayName: claims['name'] as String?,
      //   firstName: claims['given_name'] as String?,
      //   lastName: claims['family_name'] as String?,
      //   provider: AuthProvider.microsoft,
      //   accessToken: result.accessToken,
      //   idToken: result.idToken,
      //   tokenExpiry: result.expiresOn,
      //   providerData: {
      //     'tenantId': result.tenantId,
      //   },
      // );
      //
      // await _saveUser(user);
      // return OAuthResult.success(user);

      // Demo mode - return mock result
      return _mockMicrosoftSignIn();
    } catch (e) {
      debugPrint('Microsoft sign in error: $e');
      return OAuthResult.failure('Failed to sign in with Microsoft: $e');
    }
  }

  /// Mock Microsoft Sign In for demo/development
  OAuthResult _mockMicrosoftSignIn() {
    final user = OAuthUser(
      id: 'ms_demo_${DateTime.now().millisecondsSinceEpoch}',
      email: 'demo@outlook.com',
      displayName: 'Microsoft User',
      firstName: 'Demo',
      lastName: 'User',
      provider: AuthProvider.microsoft,
      accessToken: 'demo_microsoft_token',
      tokenExpiry: DateTime.now().add(const Duration(hours: 1)),
    );
    _saveUser(user);
    return OAuthResult.success(user);
  }

  // ===========================================================================
  // EMAIL/PASSWORD SIGN IN
  // ===========================================================================

  /// Sign in with email and password
  Future<OAuthResult> signInWithEmail(String email, String password) async {
    try {
      // This should call your backend API for authentication
      // Example:
      // final response = await http.post(
      //   Uri.parse('${OAuthConfig.backendBaseUrl}${OAuthConfig.authEndpoint}/login'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode({'email': email, 'password': password}),
      // );
      //
      // if (response.statusCode == 200) {
      //   final data = jsonDecode(response.body);
      //   final user = OAuthUser.fromJson(data['user']);
      //   await _saveUser(user);
      //   return OAuthResult.success(user);
      // } else {
      //   return OAuthResult.failure('Invalid email or password');
      // }

      // Demo mode - return mock result
      if (email.isNotEmpty && password.isNotEmpty) {
        final user = OAuthUser(
          id: 'email_demo_${DateTime.now().millisecondsSinceEpoch}',
          email: email,
          displayName: email.split('@').first,
          provider: AuthProvider.email,
          accessToken: 'demo_email_token',
          tokenExpiry: DateTime.now().add(const Duration(hours: 24)),
        );
        await _saveUser(user);
        return OAuthResult.success(user);
      }

      return OAuthResult.failure('Invalid email or password');
    } catch (e) {
      debugPrint('Email sign in error: $e');
      return OAuthResult.failure('Failed to sign in: $e');
    }
  }

  /// Register with email and password
  Future<OAuthResult> registerWithEmail({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    try {
      // This should call your backend API for registration
      // Example:
      // final response = await http.post(
      //   Uri.parse('${OAuthConfig.backendBaseUrl}${OAuthConfig.authEndpoint}/register'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode({
      //     'email': email,
      //     'password': password,
      //     'firstName': firstName,
      //     'lastName': lastName,
      //   }),
      // );

      // Demo mode - return mock result
      if (email.isNotEmpty && password.length >= 6) {
        final user = OAuthUser(
          id: 'email_demo_${DateTime.now().millisecondsSinceEpoch}',
          email: email,
          firstName: firstName,
          lastName: lastName,
          displayName: [firstName, lastName]
              .whereType<String>()
              .join(' ')
              .trim()
              .isNotEmpty
              ? [firstName, lastName].whereType<String>().join(' ').trim()
              : email.split('@').first,
          provider: AuthProvider.email,
          accessToken: 'demo_email_token',
          tokenExpiry: DateTime.now().add(const Duration(hours: 24)),
        );
        await _saveUser(user);
        return OAuthResult.success(user);
      }

      return OAuthResult.failure('Registration failed');
    } catch (e) {
      debugPrint('Registration error: $e');
      return OAuthResult.failure('Failed to register: $e');
    }
  }

  /// Request password reset
  Future<bool> requestPasswordReset(String email) async {
    try {
      // Call your backend API for password reset
      // Example:
      // final response = await http.post(
      //   Uri.parse('${OAuthConfig.backendBaseUrl}${OAuthConfig.authEndpoint}/forgot-password'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode({'email': email}),
      // );
      // return response.statusCode == 200;

      // Demo mode - always return success
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      debugPrint('Password reset error: $e');
      return false;
    }
  }

  // ===========================================================================
  // SIGN OUT
  // ===========================================================================

  /// Sign out from all providers
  Future<void> signOut() async {
    try {
      // Sign out from Google
      if (await isGoogleSignedIn()) {
        await _googleSignIn?.signOut();
      }

      // Clear local user data
      await _clearUser();
    } catch (e) {
      debugPrint('Sign out error: $e');
      // Still clear local data even if provider sign out fails
      await _clearUser();
    }
  }

  /// Disconnect from all providers (revoke access)
  Future<void> disconnect() async {
    try {
      // Disconnect from Google (revokes access)
      await _googleSignIn?.disconnect();

      // Clear local user data
      await _clearUser();
    } catch (e) {
      debugPrint('Disconnect error: $e');
      await _clearUser();
    }
  }

  // ===========================================================================
  // TOKEN MANAGEMENT
  // ===========================================================================

  /// Get current access token
  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  /// Refresh access token
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
      if (refreshToken == null) return false;

      // Call your backend API to refresh the token
      // Example:
      // final response = await http.post(
      //   Uri.parse('${OAuthConfig.backendBaseUrl}${OAuthConfig.refreshTokenEndpoint}'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode({'refreshToken': refreshToken}),
      // );
      //
      // if (response.statusCode == 200) {
      //   final data = jsonDecode(response.body);
      //   await _secureStorage.write(key: _tokenKey, value: data['accessToken']);
      //   if (data['refreshToken'] != null) {
      //     await _secureStorage.write(key: _refreshTokenKey, value: data['refreshToken']);
      //   }
      //   return true;
      // }

      return false;
    } catch (e) {
      debugPrint('Token refresh error: $e');
      return false;
    }
  }

  /// Dispose resources
  void dispose() {
    _authStateController.close();
  }
}
