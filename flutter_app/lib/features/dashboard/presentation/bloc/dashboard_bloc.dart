import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../services/api_service.dart';

// Events
abstract class DashboardEvent extends Equatable {
  const DashboardEvent();

  @override
  List<Object?> get props => [];
}

class LoadDashboardData extends DashboardEvent {}

class RefreshDashboardData extends DashboardEvent {}

// State
class DashboardState extends Equatable {
  final bool isLoading;
  final DashboardStats? stats;
  final List<Map<String, dynamic>> recentPosts;
  final List<Map<String, dynamic>> accounts;
  final int unreadMessages;
  final String? error;

  const DashboardState({
    this.isLoading = false,
    this.stats,
    this.recentPosts = const [],
    this.accounts = const [],
    this.unreadMessages = 0,
    this.error,
  });

  DashboardState copyWith({
    bool? isLoading,
    DashboardStats? stats,
    List<Map<String, dynamic>>? recentPosts,
    List<Map<String, dynamic>>? accounts,
    int? unreadMessages,
    String? error,
  }) {
    return DashboardState(
      isLoading: isLoading ?? this.isLoading,
      stats: stats ?? this.stats,
      recentPosts: recentPosts ?? this.recentPosts,
      accounts: accounts ?? this.accounts,
      unreadMessages: unreadMessages ?? this.unreadMessages,
      error: error,
    );
  }

  @override
  List<Object?> get props => [
        isLoading,
        stats,
        recentPosts,
        accounts,
        unreadMessages,
        error,
      ];
}

class DashboardStats {
  final int totalAccounts;
  final int accountsLimit;
  final int postsThisMonth;
  final int postsLimit;
  final int aiCreditsUsed;
  final int aiCreditsLimit;
  final int scheduledPosts;
  final String plan;

  const DashboardStats({
    required this.totalAccounts,
    required this.accountsLimit,
    required this.postsThisMonth,
    required this.postsLimit,
    required this.aiCreditsUsed,
    required this.aiCreditsLimit,
    required this.scheduledPosts,
    required this.plan,
  });
}

// Bloc
class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final ApiService _apiService;

  DashboardBloc(this._apiService) : super(const DashboardState()) {
    on<LoadDashboardData>(_onLoadDashboardData);
    on<RefreshDashboardData>(_onRefreshDashboardData);
  }

  Future<void> _onLoadDashboardData(
    LoadDashboardData event,
    Emitter<DashboardState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));
    await _fetchData(emit);
  }

  Future<void> _onRefreshDashboardData(
    RefreshDashboardData event,
    Emitter<DashboardState> emit,
  ) async {
    await _fetchData(emit);
  }

  Future<void> _fetchData(Emitter<DashboardState> emit) async {
    try {
      // Fetch all data in parallel
      final results = await Future.wait([
        _apiService.getAccounts(),
        _apiService.getPosts(limit: 5),
        _apiService.getUsage(),
        _apiService.getUnreadCount(),
      ]);

      final accountsResponse = results[0];
      final postsResponse = results[1];
      final usageResponse = results[2];
      final unreadResponse = results[3];

      final accounts = List<Map<String, dynamic>>.from(
        accountsResponse.data['data']['accounts'] ?? [],
      );

      final posts = List<Map<String, dynamic>>.from(
        postsResponse.data['data']['posts'] ?? [],
      );

      final usage = usageResponse.data['data'];
      final usageData = usage['usage'] ?? {};
      final limitsData = usage['limits'] ?? {};

      final stats = DashboardStats(
        totalAccounts: usageData['socialAccounts'] ?? 0,
        accountsLimit: limitsData['socialAccounts'] ?? 2,
        postsThisMonth: usageData['postsThisMonth'] ?? 0,
        postsLimit: limitsData['postsPerMonth'] ?? 20,
        aiCreditsUsed: usageData['aiCreditsUsed'] ?? 0,
        aiCreditsLimit: limitsData['aiCredits'] ?? 50,
        scheduledPosts: posts.where((p) => p['status'] == 'scheduled').length,
        plan: usage['plan'] ?? 'free',
      );

      final unreadCount = unreadResponse.data['data']['unreadCount'] ?? 0;

      emit(state.copyWith(
        isLoading: false,
        stats: stats,
        accounts: accounts,
        recentPosts: posts,
        unreadMessages: unreadCount,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load dashboard data',
      ));
    }
  }
}
