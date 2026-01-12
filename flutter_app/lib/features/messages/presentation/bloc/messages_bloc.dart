import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../services/api_service.dart';

// Events
abstract class MessagesEvent extends Equatable {
  const MessagesEvent();

  @override
  List<Object?> get props => [];
}

class LoadConversations extends MessagesEvent {}

class RefreshConversations extends MessagesEvent {}

class LoadMessages extends MessagesEvent {
  final String conversationId;

  const LoadMessages(this.conversationId);

  @override
  List<Object?> get props => [conversationId];
}

class SendMessage extends MessagesEvent {
  final String conversationId;
  final String content;

  const SendMessage(this.conversationId, this.content);

  @override
  List<Object?> get props => [conversationId, content];
}

class MarkAsRead extends MessagesEvent {
  final String conversationId;

  const MarkAsRead(this.conversationId);

  @override
  List<Object?> get props => [conversationId];
}

// State
class MessagesState extends Equatable {
  final bool isLoading;
  final bool isSending;
  final List<Map<String, dynamic>> conversations;
  final List<Map<String, dynamic>> messages;
  final String? selectedConversationId;
  final int unreadCount;
  final String? error;

  const MessagesState({
    this.isLoading = false,
    this.isSending = false,
    this.conversations = const [],
    this.messages = const [],
    this.selectedConversationId,
    this.unreadCount = 0,
    this.error,
  });

  MessagesState copyWith({
    bool? isLoading,
    bool? isSending,
    List<Map<String, dynamic>>? conversations,
    List<Map<String, dynamic>>? messages,
    String? selectedConversationId,
    int? unreadCount,
    String? error,
  }) {
    return MessagesState(
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      conversations: conversations ?? this.conversations,
      messages: messages ?? this.messages,
      selectedConversationId:
          selectedConversationId ?? this.selectedConversationId,
      unreadCount: unreadCount ?? this.unreadCount,
      error: error,
    );
  }

  @override
  List<Object?> get props => [
        isLoading,
        isSending,
        conversations,
        messages,
        selectedConversationId,
        unreadCount,
        error,
      ];
}

// Bloc
class MessagesBloc extends Bloc<MessagesEvent, MessagesState> {
  final ApiService _apiService;

  MessagesBloc(this._apiService) : super(const MessagesState()) {
    on<LoadConversations>(_onLoadConversations);
    on<RefreshConversations>(_onRefreshConversations);
    on<LoadMessages>(_onLoadMessages);
    on<SendMessage>(_onSendMessage);
    on<MarkAsRead>(_onMarkAsRead);
  }

  Future<void> _onLoadConversations(
    LoadConversations event,
    Emitter<MessagesState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));
    await _fetchConversations(emit);
  }

  Future<void> _onRefreshConversations(
    RefreshConversations event,
    Emitter<MessagesState> emit,
  ) async {
    await _fetchConversations(emit);
  }

  Future<void> _fetchConversations(Emitter<MessagesState> emit) async {
    try {
      final response = await _apiService.getConversations();
      final conversations = List<Map<String, dynamic>>.from(
        response.data['data']['conversations'] ?? [],
      );

      final unreadResponse = await _apiService.getUnreadCount();
      final unreadCount = unreadResponse.data['data']['unreadCount'] ?? 0;

      emit(state.copyWith(
        isLoading: false,
        conversations: conversations,
        unreadCount: unreadCount,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load conversations',
      ));
    }
  }

  Future<void> _onLoadMessages(
    LoadMessages event,
    Emitter<MessagesState> emit,
  ) async {
    emit(state.copyWith(
      isLoading: true,
      selectedConversationId: event.conversationId,
      error: null,
    ));

    try {
      final response = await _apiService.getMessages(event.conversationId);
      final messages = List<Map<String, dynamic>>.from(
        response.data['data']['messages'] ?? [],
      );

      emit(state.copyWith(
        isLoading: false,
        messages: messages,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load messages',
      ));
    }
  }

  Future<void> _onSendMessage(
    SendMessage event,
    Emitter<MessagesState> emit,
  ) async {
    emit(state.copyWith(isSending: true, error: null));

    try {
      final response = await _apiService.sendMessage(
        event.conversationId,
        event.content,
      );
      final newMessage = response.data['data']['message'];

      emit(state.copyWith(
        isSending: false,
        messages: [...state.messages, newMessage],
      ));
    } catch (e) {
      emit(state.copyWith(
        isSending: false,
        error: 'Failed to send message',
      ));
    }
  }

  Future<void> _onMarkAsRead(
    MarkAsRead event,
    Emitter<MessagesState> emit,
  ) async {
    try {
      await _apiService.markConversationAsRead(event.conversationId);

      final updatedConversations = state.conversations.map((conv) {
        if (conv['id'] == event.conversationId) {
          return {...conv, 'unreadCount': 0};
        }
        return conv;
      }).toList();

      final newUnreadCount = updatedConversations.fold<int>(
        0,
        (sum, conv) => sum + ((conv['unreadCount'] ?? 0) as int),
      );

      emit(state.copyWith(
        conversations: updatedConversations,
        unreadCount: newUnreadCount,
      ));
    } catch (e) {
      // Silent fail
    }
  }
}
