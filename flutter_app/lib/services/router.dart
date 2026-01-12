import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/dashboard/presentation/pages/main_shell.dart';
import '../features/dashboard/presentation/pages/dashboard_page.dart';
import '../features/accounts/presentation/pages/accounts_page.dart';
import '../features/posts/presentation/pages/posts_page.dart';
import '../features/posts/presentation/pages/create_post_page.dart';
import '../features/messages/presentation/pages/messages_page.dart';
import '../features/subscription/presentation/pages/subscription_page.dart';
import '../features/settings/presentation/pages/settings_page.dart';
import '../features/admin/presentation/pages/admin_dashboard_page.dart';
import '../features/admin/presentation/pages/admin_users_page.dart';
import '../features/admin/presentation/pages/admin_api_page.dart';
import '../features/admin/presentation/pages/admin_billing_page.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/dashboard',
  routes: [
    // Main App Shell (No authentication required)
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        // Dashboard
        GoRoute(
          path: '/',
          redirect: (_, __) => '/dashboard',
        ),
        GoRoute(
          path: '/dashboard',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: DashboardPage(),
          ),
        ),

        // Accounts
        GoRoute(
          path: '/accounts',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: AccountsPage(),
          ),
        ),

        // Posts
        GoRoute(
          path: '/posts',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: PostsPage(),
          ),
        ),
        GoRoute(
          path: '/posts/create',
          builder: (context, state) => const CreatePostPage(),
        ),
        GoRoute(
          path: '/posts/edit/:id',
          builder: (context, state) {
            final postId = state.pathParameters['id']!;
            final postData = state.extra as Map<String, dynamic>?;
            return CreatePostPage(
              postId: postId,
              initialData: postData,
            );
          },
        ),

        // Messages
        GoRoute(
          path: '/messages',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: MessagesPage(),
          ),
        ),

        // Subscription
        GoRoute(
          path: '/subscription',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: SubscriptionPage(),
          ),
        ),

        // Settings
        GoRoute(
          path: '/settings',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: SettingsPage(),
          ),
        ),

        // Admin Routes
        GoRoute(
          path: '/admin',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: AdminDashboardPage(),
          ),
        ),
        GoRoute(
          path: '/admin/users',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: AdminUsersPage(),
          ),
        ),
        GoRoute(
          path: '/admin/api',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: AdminApiPage(),
          ),
        ),
        GoRoute(
          path: '/admin/billing',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: AdminBillingPage(),
          ),
        ),
      ],
    ),
  ],
);
