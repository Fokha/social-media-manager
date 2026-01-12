import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:iconsax/iconsax.dart';

import 'package:social_media_manager/features/dashboard/presentation/widgets/stat_card.dart';
import 'package:social_media_manager/features/dashboard/presentation/widgets/account_card.dart';
import 'package:social_media_manager/features/dashboard/presentation/widgets/quick_action_card.dart';
import 'package:social_media_manager/core/theme/app_colors.dart';

void main() {
  group('StatCard Widget Tests', () {
    testWidgets('displays title and value correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard(
              title: 'Accounts',
              value: '5',
              subtitle: 'of 10',
              icon: Iconsax.user_octagon,
              color: AppColors.primary,
            ),
          ),
        ),
      );

      expect(find.text('Accounts'), findsOneWidget);
      expect(find.text('5'), findsOneWidget);
      expect(find.text('of 10'), findsOneWidget);
    });

    testWidgets('displays progress indicator when progress is provided', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard(
              title: 'Posts',
              value: '50',
              subtitle: 'this month',
              icon: Iconsax.document_text,
              color: AppColors.secondary,
              progress: 0.5,
            ),
          ),
        ),
      );

      expect(find.byType(LinearProgressIndicator), findsOneWidget);
    });
  });

  group('AccountCard Widget Tests', () {
    testWidgets('displays platform and username', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AccountCard(
              account: {
                'platform': 'twitter',
                'username': 'testuser',
                'isActive': true,
              },
            ),
          ),
        ),
      );

      expect(find.text('TWITTER'), findsOneWidget);
      expect(find.text('@testuser'), findsOneWidget);
    });

    testWidgets('shows active status indicator', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AccountCard(
              account: {
                'platform': 'instagram',
                'username': 'demo_brand',
                'isActive': true,
              },
            ),
          ),
        ),
      );

      // Should find the active status indicator (green dot)
      final container = find.byWidgetPredicate((widget) {
        if (widget is Container) {
          final decoration = widget.decoration;
          if (decoration is BoxDecoration && decoration.shape == BoxShape.circle) {
            return decoration.color == AppColors.success;
          }
        }
        return false;
      });
      expect(container, findsOneWidget);
    });

    testWidgets('shows inactive status indicator', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AccountCard(
              account: {
                'platform': 'linkedin',
                'username': 'company',
                'isActive': false,
              },
            ),
          ),
        ),
      );

      // Should find the inactive status indicator (grey dot)
      final container = find.byWidgetPredicate((widget) {
        if (widget is Container) {
          final decoration = widget.decoration;
          if (decoration is BoxDecoration && decoration.shape == BoxShape.circle) {
            return decoration.color == AppColors.grey400;
          }
        }
        return false;
      });
      expect(container, findsOneWidget);
    });
  });

  group('QuickActionCard Widget Tests', () {
    testWidgets('displays title and icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QuickActionCard(
              title: 'Create Post',
              icon: Iconsax.edit,
              color: AppColors.primary,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Create Post'), findsOneWidget);
      expect(find.byIcon(Iconsax.edit), findsOneWidget);
    });

    testWidgets('triggers onTap callback when tapped', (WidgetTester tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QuickActionCard(
              title: 'View Messages',
              icon: Iconsax.message,
              color: AppColors.accent,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('View Messages'));
      expect(tapped, isTrue);
    });
  });

  group('Color Theme Tests', () {
    test('AppColors has correct primary color', () {
      expect(AppColors.primary, isNotNull);
    });

    test('AppColors has platform-specific colors', () {
      expect(AppColors.twitter, isNotNull);
      expect(AppColors.instagram, isNotNull);
      expect(AppColors.linkedin, isNotNull);
    });

    test('AppColors has status colors', () {
      expect(AppColors.success, isNotNull);
      expect(AppColors.error, isNotNull);
      expect(AppColors.warning, isNotNull);
    });
  });
}
