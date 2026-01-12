import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../services/api_service.dart';

// Events
abstract class PostsEvent extends Equatable {
  const PostsEvent();

  @override
  List<Object?> get props => [];
}

class LoadPosts extends PostsEvent {
  final String? status;
  final int? limit;

  const LoadPosts({this.status, this.limit});

  @override
  List<Object?> get props => [status, limit];
}

class RefreshPosts extends PostsEvent {}

class CreatePost extends PostsEvent {
  final String content;
  final List<String> platforms;
  final List<String>? mediaUrls;
  final DateTime? scheduledAt;

  const CreatePost({
    required this.content,
    required this.platforms,
    this.mediaUrls,
    this.scheduledAt,
  });

  @override
  List<Object?> get props => [content, platforms, mediaUrls, scheduledAt];
}

class UpdatePost extends PostsEvent {
  final String postId;
  final Map<String, dynamic> updates;

  const UpdatePost(this.postId, this.updates);

  @override
  List<Object?> get props => [postId, updates];
}

class DeletePost extends PostsEvent {
  final String postId;

  const DeletePost(this.postId);

  @override
  List<Object?> get props => [postId];
}

class GenerateAIContent extends PostsEvent {
  final String prompt;
  final String? tone;
  final int? maxLength;

  const GenerateAIContent({
    required this.prompt,
    this.tone,
    this.maxLength,
  });

  @override
  List<Object?> get props => [prompt, tone, maxLength];
}

// State
class PostsState extends Equatable {
  final bool isLoading;
  final bool isCreating;
  final bool isGeneratingAI;
  final List<Map<String, dynamic>> posts;
  final String? generatedContent;
  final String? error;
  final String? successMessage;

  const PostsState({
    this.isLoading = false,
    this.isCreating = false,
    this.isGeneratingAI = false,
    this.posts = const [],
    this.generatedContent,
    this.error,
    this.successMessage,
  });

  PostsState copyWith({
    bool? isLoading,
    bool? isCreating,
    bool? isGeneratingAI,
    List<Map<String, dynamic>>? posts,
    String? generatedContent,
    String? error,
    String? successMessage,
  }) {
    return PostsState(
      isLoading: isLoading ?? this.isLoading,
      isCreating: isCreating ?? this.isCreating,
      isGeneratingAI: isGeneratingAI ?? this.isGeneratingAI,
      posts: posts ?? this.posts,
      generatedContent: generatedContent,
      error: error,
      successMessage: successMessage,
    );
  }

  @override
  List<Object?> get props => [
        isLoading,
        isCreating,
        isGeneratingAI,
        posts,
        generatedContent,
        error,
        successMessage,
      ];
}

// Bloc
class PostsBloc extends Bloc<PostsEvent, PostsState> {
  final ApiService _apiService;

  PostsBloc(this._apiService) : super(const PostsState()) {
    on<LoadPosts>(_onLoadPosts);
    on<RefreshPosts>(_onRefreshPosts);
    on<CreatePost>(_onCreatePost);
    on<UpdatePost>(_onUpdatePost);
    on<DeletePost>(_onDeletePost);
    on<GenerateAIContent>(_onGenerateAIContent);
  }

  Future<void> _onLoadPosts(
    LoadPosts event,
    Emitter<PostsState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, error: null));
    await _fetchPosts(emit, status: event.status, limit: event.limit);
  }

  Future<void> _onRefreshPosts(
    RefreshPosts event,
    Emitter<PostsState> emit,
  ) async {
    await _fetchPosts(emit);
  }

  Future<void> _fetchPosts(
    Emitter<PostsState> emit, {
    String? status,
    int? limit,
  }) async {
    try {
      final response = await _apiService.getPosts(
        status: status,
        limit: limit ?? 50,
      );
      final posts = List<Map<String, dynamic>>.from(
        response.data['data']['posts'] ?? [],
      );

      emit(state.copyWith(
        isLoading: false,
        posts: posts,
      ));
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        error: 'Failed to load posts',
      ));
    }
  }

  Future<void> _onCreatePost(
    CreatePost event,
    Emitter<PostsState> emit,
  ) async {
    emit(state.copyWith(isCreating: true, error: null));

    try {
      await _apiService.createPost(
        content: event.content,
        platforms: event.platforms,
        mediaUrls: event.mediaUrls,
        scheduledAt: event.scheduledAt?.toIso8601String(),
      );

      emit(state.copyWith(
        isCreating: false,
        successMessage: event.scheduledAt != null
            ? 'Post scheduled successfully'
            : 'Post created successfully',
      ));

      // Refresh posts list
      add(RefreshPosts());
    } catch (e) {
      emit(state.copyWith(
        isCreating: false,
        error: 'Failed to create post',
      ));
    }
  }

  Future<void> _onUpdatePost(
    UpdatePost event,
    Emitter<PostsState> emit,
  ) async {
    try {
      await _apiService.updatePost(event.postId, event.updates);

      final updatedPosts = state.posts.map((post) {
        if (post['id'] == event.postId) {
          return {...post, ...event.updates};
        }
        return post;
      }).toList();

      emit(state.copyWith(
        posts: updatedPosts,
        successMessage: 'Post updated successfully',
      ));
    } catch (e) {
      emit(state.copyWith(error: 'Failed to update post'));
    }
  }

  Future<void> _onDeletePost(
    DeletePost event,
    Emitter<PostsState> emit,
  ) async {
    try {
      await _apiService.deletePost(event.postId);

      final updatedPosts =
          state.posts.where((p) => p['id'] != event.postId).toList();

      emit(state.copyWith(
        posts: updatedPosts,
        successMessage: 'Post deleted successfully',
      ));
    } catch (e) {
      emit(state.copyWith(error: 'Failed to delete post'));
    }
  }

  Future<void> _onGenerateAIContent(
    GenerateAIContent event,
    Emitter<PostsState> emit,
  ) async {
    emit(state.copyWith(isGeneratingAI: true, error: null));

    try {
      final response = await _apiService.generateContent(
        prompt: event.prompt,
        tone: event.tone,
        maxLength: event.maxLength,
      );

      final content = response.data['data']['content'] as String;

      emit(state.copyWith(
        isGeneratingAI: false,
        generatedContent: content,
      ));
    } catch (e) {
      emit(state.copyWith(
        isGeneratingAI: false,
        error: 'Failed to generate content',
      ));
    }
  }
}
