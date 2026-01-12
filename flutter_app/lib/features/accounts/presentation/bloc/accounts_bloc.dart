import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../services/api_service.dart';

// Events
abstract class AccountsEvent extends Equatable {
  const AccountsEvent();

  @override
  List<Object?> get props => [];
}

class LoadAccounts extends AccountsEvent {}

class RefreshAccounts extends AccountsEvent {}

class ConnectAccount extends AccountsEvent {
  final String platform;

  const ConnectAccount(this.platform);

  @override
  List<Object?> get props => [platform];
}

class DisconnectAccount extends AccountsEvent {
  final String accountId;

  const DisconnectAccount(this.accountId);

  @override
  List<Object?> get props => [accountId];
}

class UpdateAccountSettings extends AccountsEvent {
  final String accountId;
  final Map<String, dynamic> settings;

  const UpdateAccountSettings(this.accountId, this.settings);

  @override
  List<Object?> get props => [accountId, settings];
}

// State
class AccountsState extends Equatable {
  final bool isLoading;
  final List<Map<String, dynamic>> accounts;
  final Map<String, dynamic>? selectedAccount;
  final String? error;
  final String? connectingPlatform;

  const AccountsState({
    this.isLoading = false,
    this.accounts = const [],
    this.selectedAccount,
    this.error,
    this.connectingPlatform,
  });

  AccountsState copyWith({
    bool? isLoading,
    List<Map<String, dynamic>>? accounts,
    Map<String, dynamic>? selectedAccount,
    String? error,
    String? connectingPlatform,
  }) {
    return AccountsState(
      isLoading: isLoading ?? this.isLoading,
      accounts: accounts ?? this.accounts,
      selectedAccount: selectedAccount ?? this.selectedAccount,
      error: error,
      connectingPlatform: connectingPlatform,
    );
  }

  @override
  List<Object?> get props => [
        isLoading,
        accounts,
        selectedAccount,
        error,
        connectingPlatform,
      ];
}

// Bloc
class AccountsBloc extends Bloc<AccountsEvent, AccountsState> {
  final ApiService _apiService;

  AccountsBloc(this._apiService) : super(const AccountsState()) {
    on<LoadAccounts>(_onLoadAccounts);
    on<RefreshAccounts>(_onRefreshAccounts);
    on<ConnectAccount>(_onConnectAccount);
    on<DisconnectAccount>(_onDisconnectAccount);
    on<UpdateAccountSettings>(_onUpdateAccountSettings);
  }

  Future<void> _onLoadAccounts(
    LoadAccounts event,
    Emitter<AccountsState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));
    await _fetchAccounts(emit);
  }

  Future<void> _onRefreshAccounts(
    RefreshAccounts event,
    Emitter<AccountsState> emit,
  ) async {
    await _fetchAccounts(emit);
  }

  Future<void> _fetchAccounts(Emitter<AccountsState> emit) async {
    try {
      final response = await _apiService.getAccounts();
      final accounts = List<Map<String, dynamic>>.from(
        response.data['data']['accounts'] ?? [],
      );

      emit(state.copyWith(
        isLoading: false,
        accounts: accounts,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load accounts',
      ));
    }
  }

  Future<void> _onConnectAccount(
    ConnectAccount event,
    Emitter<AccountsState> emit,
  ) async {
    emit(state.copyWith(connectingPlatform: event.platform, error: null));

    try {
      final response = await _apiService.getOAuthUrl(event.platform);
      final data = response.data['data'] as Map<String, dynamic>?;

      // Check if this is a demo connection (account returned directly)
      if (data != null && data['isDemoConnection'] == true) {
        final newAccount = data['account'] as Map<String, dynamic>?;
        if (newAccount != null) {
          // Check if account already exists (by platform)
          final existingIndex = state.accounts.indexWhere(
            (a) => a['platform'] == newAccount['platform'],
          );

          List<Map<String, dynamic>> updatedAccounts;
          if (existingIndex >= 0) {
            // Already connected - just show message
            emit(state.copyWith(
              connectingPlatform: null,
              error: '${event.platform} account is already connected',
            ));
            return;
          } else {
            // Add new account
            updatedAccounts = [...state.accounts, newAccount];
          }

          emit(state.copyWith(
            connectingPlatform: null,
            accounts: updatedAccounts,
          ));
          return;
        }
      }

      // Real OAuth flow - would open browser
      // For now, just clear the connecting state and refresh accounts
      emit(state.copyWith(connectingPlatform: null));
      add(RefreshAccounts());
    } catch (e) {
      emit(state.copyWith(
        connectingPlatform: null,
        error: 'Failed to connect account',
      ));
    }
  }

  Future<void> _onDisconnectAccount(
    DisconnectAccount event,
    Emitter<AccountsState> emit,
  ) async {
    try {
      await _apiService.disconnectAccount(event.accountId);

      final updatedAccounts = state.accounts
          .where((a) => a['id'] != event.accountId)
          .toList();

      emit(state.copyWith(accounts: updatedAccounts));
    } catch (e) {
      emit(state.copyWith(error: 'Failed to disconnect account'));
    }
  }

  Future<void> _onUpdateAccountSettings(
    UpdateAccountSettings event,
    Emitter<AccountsState> emit,
  ) async {
    try {
      await _apiService.updateAccount(event.accountId, event.settings);

      final updatedAccounts = state.accounts.map((account) {
        if (account['id'] == event.accountId) {
          return {...account, ...event.settings};
        }
        return account;
      }).toList();

      emit(state.copyWith(accounts: updatedAccounts));
    } catch (e) {
      emit(state.copyWith(error: 'Failed to update account'));
    }
  }
}
