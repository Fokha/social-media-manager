import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../services/api_service.dart';

// Events
abstract class AdminEvent extends Equatable {
  const AdminEvent();

  @override
  List<Object?> get props => [];
}

class LoadAdminDashboard extends AdminEvent {}

class LoadUsers extends AdminEvent {
  final int page;
  final int limit;

  const LoadUsers({this.page = 1, this.limit = 20});

  @override
  List<Object?> get props => [page, limit];
}

class LoadApiSettings extends AdminEvent {}

class UpdateApiKey extends AdminEvent {
  final String provider;
  final String apiKey;

  const UpdateApiKey(this.provider, this.apiKey);

  @override
  List<Object?> get props => [provider, apiKey];
}

class LoadBillingData extends AdminEvent {}

class UpdateUserRole extends AdminEvent {
  final String userId;
  final String role;

  const UpdateUserRole(this.userId, this.role);

  @override
  List<Object?> get props => [userId, role];
}

class UpdateUserStatus extends AdminEvent {
  final String userId;
  final bool isActive;

  const UpdateUserStatus(this.userId, this.isActive);

  @override
  List<Object?> get props => [userId, isActive];
}

// State
class AdminState extends Equatable {
  final bool isLoading;
  final Map<String, dynamic> dashboardStats;
  final List<Map<String, dynamic>> users;
  final List<Map<String, dynamic>> apiProviders;
  final Map<String, dynamic> billingData;
  final int totalUsers;
  final int currentPage;
  final int totalPages;
  final int usersPerPage;
  final String? error;
  final String? successMessage;

  const AdminState({
    this.isLoading = false,
    this.dashboardStats = const {},
    this.users = const [],
    this.apiProviders = const [],
    this.billingData = const {},
    this.totalUsers = 0,
    this.currentPage = 1,
    this.totalPages = 1,
    this.usersPerPage = 20,
    this.error,
    this.successMessage,
  });

  AdminState copyWith({
    bool? isLoading,
    Map<String, dynamic>? dashboardStats,
    List<Map<String, dynamic>>? users,
    List<Map<String, dynamic>>? apiProviders,
    Map<String, dynamic>? billingData,
    int? totalUsers,
    int? currentPage,
    int? totalPages,
    int? usersPerPage,
    String? error,
    String? successMessage,
  }) {
    return AdminState(
      isLoading: isLoading ?? this.isLoading,
      dashboardStats: dashboardStats ?? this.dashboardStats,
      users: users ?? this.users,
      apiProviders: apiProviders ?? this.apiProviders,
      billingData: billingData ?? this.billingData,
      totalUsers: totalUsers ?? this.totalUsers,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      usersPerPage: usersPerPage ?? this.usersPerPage,
      error: error,
      successMessage: successMessage,
    );
  }

  @override
  List<Object?> get props => [
        isLoading,
        dashboardStats,
        users,
        apiProviders,
        billingData,
        totalUsers,
        currentPage,
        totalPages,
        usersPerPage,
        error,
        successMessage,
      ];
}

// Bloc
class AdminBloc extends Bloc<AdminEvent, AdminState> {
  final ApiService _apiService;

  AdminBloc(this._apiService) : super(const AdminState()) {
    on<LoadAdminDashboard>(_onLoadAdminDashboard);
    on<LoadUsers>(_onLoadUsers);
    on<LoadApiSettings>(_onLoadApiSettings);
    on<UpdateApiKey>(_onUpdateApiKey);
    on<LoadBillingData>(_onLoadBillingData);
    on<UpdateUserRole>(_onUpdateUserRole);
    on<UpdateUserStatus>(_onUpdateUserStatus);
  }

  Future<void> _onLoadAdminDashboard(
    LoadAdminDashboard event,
    Emitter<AdminState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));

    try {
      final response = await _apiService.getAdminStats();
      final stats = response.data['data'] as Map<String, dynamic>? ?? {};

      emit(state.copyWith(
        isLoading: false,
        dashboardStats: stats,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load admin dashboard',
      ));
    }
  }

  Future<void> _onLoadUsers(
    LoadUsers event,
    Emitter<AdminState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));

    try {
      final response = await _apiService.getAdminUsers(
        page: event.page,
        limit: event.limit,
      );
      final data = response.data['data'];
      final users = List<Map<String, dynamic>>.from(data['users'] ?? []);
      final total = data['total'] ?? 0;
      final totalPages = (total / event.limit).ceil();

      emit(state.copyWith(
        isLoading: false,
        users: users,
        totalUsers: total,
        currentPage: event.page,
        totalPages: totalPages > 0 ? totalPages : 1,
        usersPerPage: event.limit,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load users',
      ));
    }
  }

  Future<void> _onLoadApiSettings(
    LoadApiSettings event,
    Emitter<AdminState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));

    try {
      final response = await _apiService.getAdminApiSettings();
      final providers = List<Map<String, dynamic>>.from(
        response.data['data']['providers'] ?? [],
      );

      emit(state.copyWith(
        isLoading: false,
        apiProviders: providers,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load API settings',
      ));
    }
  }

  Future<void> _onUpdateApiKey(
    UpdateApiKey event,
    Emitter<AdminState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));

    try {
      await _apiService.updateAdminApiKey(event.provider, event.apiKey);

      emit(state.copyWith(
        isLoading: false,
        successMessage: 'API key updated successfully',
      ));

      add(LoadApiSettings());
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to update API key',
      ));
    }
  }

  Future<void> _onLoadBillingData(
    LoadBillingData event,
    Emitter<AdminState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));

    try {
      final response = await _apiService.getAdminBilling();
      final data = response.data['data'] as Map<String, dynamic>? ?? {};

      emit(state.copyWith(
        isLoading: false,
        billingData: data,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load billing data',
      ));
    }
  }

  Future<void> _onUpdateUserRole(
    UpdateUserRole event,
    Emitter<AdminState> emit,
  ) async {
    try {
      await _apiService.updateUserRole(event.userId, event.role);

      final updatedUsers = state.users.map((user) {
        if (user['id'] == event.userId) {
          return {...user, 'role': event.role};
        }
        return user;
      }).toList();

      emit(state.copyWith(
        users: updatedUsers,
        successMessage: 'User role updated successfully',
      ));
    } catch (e) {
      emit(state.copyWith(error: 'Failed to update user role'));
    }
  }

  Future<void> _onUpdateUserStatus(
    UpdateUserStatus event,
    Emitter<AdminState> emit,
  ) async {
    try {
      await _apiService.updateUserStatus(event.userId, event.isActive);

      final updatedUsers = state.users.map((user) {
        if (user['id'] == event.userId) {
          return {...user, 'isActive': event.isActive};
        }
        return user;
      }).toList();

      emit(state.copyWith(
        users: updatedUsers,
        successMessage: event.isActive
            ? 'User activated successfully'
            : 'User deactivated successfully',
      ));
    } catch (e) {
      emit(state.copyWith(error: 'Failed to update user status'));
    }
  }
}
