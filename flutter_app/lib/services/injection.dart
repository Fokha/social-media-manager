import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/constants/app_constants.dart';
import 'api_service.dart';
import 'storage_service.dart';
import 'socket_service.dart';
import '../features/auth/data/repositories/auth_repository_impl.dart';
import '../features/auth/domain/repositories/auth_repository.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../features/dashboard/presentation/bloc/dashboard_bloc.dart';
import '../features/accounts/presentation/bloc/accounts_bloc.dart';
import '../features/posts/presentation/bloc/posts_bloc.dart';
import '../features/messages/presentation/bloc/messages_bloc.dart';
import '../features/subscription/presentation/bloc/subscription_bloc.dart';
import '../features/admin/presentation/bloc/admin_bloc.dart';

final getIt = GetIt.instance;

Future<void> configureDependencies() async {
  // External Services
  final sharedPreferences = await SharedPreferences.getInstance();
  getIt.registerSingleton<SharedPreferences>(sharedPreferences);

  const secureStorage = FlutterSecureStorage();
  getIt.registerSingleton<FlutterSecureStorage>(secureStorage);

  // Dio
  final dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    connectTimeout: AppConstants.connectionTimeout,
    receiveTimeout: AppConstants.receiveTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Add interceptors
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await secureStorage.read(key: AppConstants.tokenKey);
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
    onError: (error, handler) {
      if (error.response?.statusCode == 401) {
        // Handle unauthorized - logout user
        getIt<AuthBloc>().add(LogoutRequested());
      }
      handler.next(error);
    },
  ));

  getIt.registerSingleton<Dio>(dio);

  // Services
  getIt.registerSingleton<ApiService>(ApiService(dio));
  getIt.registerSingleton<StorageService>(StorageService(
    sharedPreferences,
    secureStorage,
  ));
  getIt.registerSingleton<SocketService>(SocketService());

  // Repositories
  getIt.registerSingleton<AuthRepository>(AuthRepositoryImpl(
    getIt<ApiService>(),
    getIt<StorageService>(),
  ));

  // Blocs - AuthBloc must be singleton for router to see auth state changes
  getIt.registerLazySingleton<AuthBloc>(() => AuthBloc(getIt<AuthRepository>()));
  getIt.registerFactory<DashboardBloc>(() => DashboardBloc(getIt<ApiService>()));
  getIt.registerFactory<AccountsBloc>(() => AccountsBloc(getIt<ApiService>()));
  getIt.registerFactory<PostsBloc>(() => PostsBloc(getIt<ApiService>()));
  getIt.registerFactory<MessagesBloc>(() => MessagesBloc(getIt<ApiService>()));
  getIt.registerFactory<SubscriptionBloc>(() => SubscriptionBloc(getIt<ApiService>()));
  getIt.registerFactory<AdminBloc>(() => AdminBloc(getIt<ApiService>()));
}
