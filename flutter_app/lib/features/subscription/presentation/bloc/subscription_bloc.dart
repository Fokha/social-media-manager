import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../services/api_service.dart';

// Events
abstract class SubscriptionEvent extends Equatable {
  const SubscriptionEvent();

  @override
  List<Object?> get props => [];
}

class LoadSubscription extends SubscriptionEvent {}

class LoadPlans extends SubscriptionEvent {}

class SubscribeToPlan extends SubscriptionEvent {
  final String planId;

  const SubscribeToPlan(this.planId);

  @override
  List<Object?> get props => [planId];
}

class CancelSubscription extends SubscriptionEvent {}

class LoadBillingHistory extends SubscriptionEvent {}

// State
class SubscriptionState extends Equatable {
  final bool isLoading;
  final bool isSubscribing;
  final Map<String, dynamic>? currentSubscription;
  final List<Map<String, dynamic>> plans;
  final List<Map<String, dynamic>> billingHistory;
  final Map<String, dynamic>? usage;
  final String? error;
  final String? successMessage;
  final String? checkoutUrl;

  const SubscriptionState({
    this.isLoading = false,
    this.isSubscribing = false,
    this.currentSubscription,
    this.plans = const [],
    this.billingHistory = const [],
    this.usage,
    this.error,
    this.successMessage,
    this.checkoutUrl,
  });

  SubscriptionState copyWith({
    bool? isLoading,
    bool? isSubscribing,
    Map<String, dynamic>? currentSubscription,
    List<Map<String, dynamic>>? plans,
    List<Map<String, dynamic>>? billingHistory,
    Map<String, dynamic>? usage,
    String? error,
    String? successMessage,
    String? checkoutUrl,
  }) {
    return SubscriptionState(
      isLoading: isLoading ?? this.isLoading,
      isSubscribing: isSubscribing ?? this.isSubscribing,
      currentSubscription: currentSubscription ?? this.currentSubscription,
      plans: plans ?? this.plans,
      billingHistory: billingHistory ?? this.billingHistory,
      usage: usage ?? this.usage,
      error: error,
      successMessage: successMessage,
      checkoutUrl: checkoutUrl,
    );
  }

  @override
  List<Object?> get props => [
        isLoading,
        isSubscribing,
        currentSubscription,
        plans,
        billingHistory,
        usage,
        error,
        successMessage,
        checkoutUrl,
      ];
}

// Bloc
class SubscriptionBloc extends Bloc<SubscriptionEvent, SubscriptionState> {
  final ApiService _apiService;

  SubscriptionBloc(this._apiService) : super(const SubscriptionState()) {
    on<LoadSubscription>(_onLoadSubscription);
    on<LoadPlans>(_onLoadPlans);
    on<SubscribeToPlan>(_onSubscribeToPlan);
    on<CancelSubscription>(_onCancelSubscription);
    on<LoadBillingHistory>(_onLoadBillingHistory);
  }

  Future<void> _onLoadSubscription(
    LoadSubscription event,
    Emitter<SubscriptionState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));

    try {
      final results = await Future.wait([
        _apiService.getSubscription(),
        _apiService.getUsage(),
        _apiService.getPlans(),
      ]);

      final subscriptionData = results[0].data['data'];
      final usageData = results[1].data['data'];
      final plansData = results[2].data['data']['plans'] as List? ?? [];

      emit(state.copyWith(
        isLoading: false,
        currentSubscription: subscriptionData,
        usage: usageData,
        plans: List<Map<String, dynamic>>.from(plansData),
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load subscription data',
      ));
    }
  }

  Future<void> _onLoadPlans(
    LoadPlans event,
    Emitter<SubscriptionState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));

    try {
      final response = await _apiService.getPlans();
      final plans = List<Map<String, dynamic>>.from(
        response.data['data']['plans'] ?? [],
      );

      emit(state.copyWith(
        isLoading: false,
        plans: plans,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load plans',
      ));
    }
  }

  Future<void> _onSubscribeToPlan(
    SubscribeToPlan event,
    Emitter<SubscriptionState> emit,
  ) async {
    emit(state.copyWith(isSubscribing: true, error: null));

    try {
      final response = await _apiService.createCheckoutSession(event.planId);
      final checkoutUrl = response.data['data']['checkoutUrl'];

      emit(state.copyWith(
        isSubscribing: false,
        checkoutUrl: checkoutUrl,
      ));
    } catch (e) {
      emit(state.copyWith(
        isSubscribing: false,
        error: 'Failed to create checkout session',
      ));
    }
  }

  Future<void> _onCancelSubscription(
    CancelSubscription event,
    Emitter<SubscriptionState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));

    try {
      await _apiService.cancelSubscription();

      emit(state.copyWith(
        isLoading: false,
        successMessage: 'Subscription cancelled successfully',
      ));

      // Refresh subscription data
      add(LoadSubscription());
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to cancel subscription',
      ));
    }
  }

  Future<void> _onLoadBillingHistory(
    LoadBillingHistory event,
    Emitter<SubscriptionState> emit,
  ) async {
    try {
      final response = await _apiService.getBillingHistory();
      final history = List<Map<String, dynamic>>.from(
        response.data['data']['invoices'] ?? [],
      );

      emit(state.copyWith(billingHistory: history));
    } catch (e) {
      // Silent fail
    }
  }
}
