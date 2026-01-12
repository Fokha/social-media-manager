import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../services/oauth_service.dart';

// Events
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthStatus extends AuthEvent {}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  const LoginRequested({required this.email, required this.password});

  @override
  List<Object?> get props => [email, password];
}

class RegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String? firstName;
  final String? lastName;

  const RegisterRequested({
    required this.email,
    required this.password,
    this.firstName,
    this.lastName,
  });

  @override
  List<Object?> get props => [email, password, firstName, lastName];
}

class LogoutRequested extends AuthEvent {}

class RefreshUser extends AuthEvent {}

// OAuth Events
class GoogleSignInRequested extends AuthEvent {}

class AppleSignInRequested extends AuthEvent {}

class MicrosoftSignInRequested extends AuthEvent {}

class OAuthSignInCompleted extends AuthEvent {
  final OAuthUser oauthUser;

  const OAuthSignInCompleted(this.oauthUser);

  @override
  List<Object?> get props => [oauthUser];
}

// States
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final User user;

  const AuthAuthenticated(this.user);

  @override
  List<Object?> get props => [user];
}

class AuthUnauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}

// Bloc
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;
  final OAuthService _oauthService = OAuthService.instance;

  AuthBloc(this._authRepository) : super(AuthInitial()) {
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<LoginRequested>(_onLoginRequested);
    on<RegisterRequested>(_onRegisterRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<RefreshUser>(_onRefreshUser);
    // OAuth handlers
    on<GoogleSignInRequested>(_onGoogleSignInRequested);
    on<AppleSignInRequested>(_onAppleSignInRequested);
    on<MicrosoftSignInRequested>(_onMicrosoftSignInRequested);
    on<OAuthSignInCompleted>(_onOAuthSignInCompleted);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final isLoggedIn = await _authRepository.isLoggedIn();
      if (isLoggedIn) {
        final user = await _authRepository.getCurrentUser();
        if (user != null) {
          emit(AuthAuthenticated(user));
        } else {
          emit(AuthUnauthenticated());
        }
      } else {
        emit(AuthUnauthenticated());
      }
    } catch (e) {
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.login(event.email, event.password);
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await _authRepository.register(
        email: event.email,
        password: event.password,
        firstName: event.firstName,
        lastName: event.lastName,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _authRepository.logout();
    emit(AuthUnauthenticated());
  }

  Future<void> _onRefreshUser(
    RefreshUser event,
    Emitter<AuthState> emit,
  ) async {
    if (state is AuthAuthenticated) {
      try {
        final user = await _authRepository.getCurrentUser();
        if (user != null) {
          emit(AuthAuthenticated(user));
        }
      } catch (_) {}
    }
  }

  String _getErrorMessage(dynamic error) {
    if (error is Exception) {
      final message = error.toString();
      if (message.contains('401')) {
        return 'Invalid email or password';
      } else if (message.contains('400')) {
        return 'Invalid request. Please check your input.';
      } else if (message.contains('409')) {
        return 'Email already registered';
      } else if (message.contains('network')) {
        return 'Network error. Please check your connection.';
      }
    }
    return 'Something went wrong. Please try again.';
  }

  // OAuth Handlers
  Future<void> _onGoogleSignInRequested(
    GoogleSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final result = await _oauthService.signInWithGoogle();
      if (result.success && result.user != null) {
        final user = _oauthUserToUser(result.user!);
        emit(AuthAuthenticated(user));
      } else {
        if (result.errorCode == 'cancelled') {
          emit(AuthUnauthenticated());
        } else {
          emit(AuthError(result.error ?? 'Google sign in failed'));
        }
      }
    } catch (e) {
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onAppleSignInRequested(
    AppleSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final result = await _oauthService.signInWithApple();
      if (result.success && result.user != null) {
        final user = _oauthUserToUser(result.user!);
        emit(AuthAuthenticated(user));
      } else {
        if (result.errorCode == 'cancelled') {
          emit(AuthUnauthenticated());
        } else {
          emit(AuthError(result.error ?? 'Apple sign in failed'));
        }
      }
    } catch (e) {
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onMicrosoftSignInRequested(
    MicrosoftSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final result = await _oauthService.signInWithMicrosoft();
      if (result.success && result.user != null) {
        final user = _oauthUserToUser(result.user!);
        emit(AuthAuthenticated(user));
      } else {
        if (result.errorCode == 'cancelled') {
          emit(AuthUnauthenticated());
        } else {
          emit(AuthError(result.error ?? 'Microsoft sign in failed'));
        }
      }
    } catch (e) {
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  Future<void> _onOAuthSignInCompleted(
    OAuthSignInCompleted event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final user = _oauthUserToUser(event.oauthUser);
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(_getErrorMessage(e)));
    }
  }

  /// Convert OAuthUser to app User model
  User _oauthUserToUser(OAuthUser oauthUser) {
    return User(
      id: oauthUser.id,
      email: oauthUser.email,
      firstName: oauthUser.firstName,
      lastName: oauthUser.lastName,
      avatar: oauthUser.photoUrl,
      role: UserRole.user,
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: DateTime.now(),
      settings: const UserSettings(
        notifications: NotificationSettings(
          email: true,
          push: true,
          sms: false,
        ),
        timezone: 'UTC',
        language: 'en',
      ),
      subscription: Subscription(
        id: 'demo_sub',
        plan: 'pro',
        status: 'active',
        cancelAtPeriodEnd: false,
        limits: const SubscriptionLimits(
          socialAccounts: 10,
          postsPerMonth: 100,
          aiCredits: 50,
          teamMembers: 5,
          scheduledPosts: 20,
        ),
        usage: const SubscriptionUsage(
          socialAccounts: 0,
          postsThisMonth: 0,
          aiCreditsUsed: 0,
          teamMembers: 1,
        ),
      ),
    );
  }
}
