import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:iconsax/iconsax.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../bloc/subscription_bloc.dart';

class SubscriptionPage extends StatelessWidget {
  const SubscriptionPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<SubscriptionBloc>()
        ..add(LoadSubscription())
        ..add(LoadBillingHistory()),
      child: const _SubscriptionView(),
    );
  }
}

class _SubscriptionView extends StatelessWidget {
  const _SubscriptionView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription'),
      ),
      body: BlocConsumer<SubscriptionBloc, SubscriptionState>(
        listener: (context, state) {
          if (state.error != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.error!),
                backgroundColor: AppColors.error,
              ),
            );
          }
          if (state.successMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.successMessage!),
                backgroundColor: AppColors.success,
              ),
            );
          }
          if (state.checkoutUrl != null) {
            launchUrl(Uri.parse(state.checkoutUrl!));
          }
        },
        builder: (context, state) {
          if (state.isLoading && state.currentSubscription == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Current Plan
                _buildCurrentPlan(context, state),
                const SizedBox(height: 24),

                // Usage Stats
                _buildUsageStats(context, state),
                const SizedBox(height: 24),

                // Available Plans
                Text(
                  'Available Plans',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _buildPlansList(context, state),
                const SizedBox(height: 24),

                // Billing History
                if (state.billingHistory.isNotEmpty) ...[
                  Text(
                    'Billing History',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  _buildBillingHistory(context, state),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCurrentPlan(BuildContext context, SubscriptionState state) {
    final subscription = state.currentSubscription;
    final plan = subscription?['plan'] ?? 'free';
    final status = subscription?['status'] ?? 'active';
    final currentPeriodEnd = subscription?['currentPeriodEnd'];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Current Plan',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getPlanName(plan),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status.toString().toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (currentPeriodEnd != null) ...[
            const SizedBox(height: 16),
            Text(
              'Renews on ${_formatDate(currentPeriodEnd)}',
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 12,
              ),
            ),
          ],
          if (plan != 'free') ...[
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => _showCancelDialog(context),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white),
              ),
              child: const Text('Cancel Subscription'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildUsageStats(BuildContext context, SubscriptionState state) {
    final usage = state.usage?['usage'] ?? {};
    final limits = state.usage?['limits'] ?? {};

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Usage This Month',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),
          _UsageBar(
            label: 'Social Accounts',
            current: usage['socialAccounts'] ?? 0,
            limit: limits['socialAccounts'] ?? 2,
            color: AppColors.primary,
          ),
          const SizedBox(height: 12),
          _UsageBar(
            label: 'Posts',
            current: usage['postsThisMonth'] ?? 0,
            limit: limits['postsPerMonth'] ?? 20,
            color: AppColors.secondary,
          ),
          const SizedBox(height: 12),
          _UsageBar(
            label: 'AI Credits',
            current: usage['aiCreditsUsed'] ?? 0,
            limit: limits['aiCredits'] ?? 50,
            color: AppColors.info,
          ),
        ],
      ),
    );
  }

  Widget _buildPlansList(BuildContext context, SubscriptionState state) {
    // Default plans if none from API
    final plans = state.plans.isNotEmpty
        ? state.plans
        : [
            {
              'id': 'free',
              'name': 'Free',
              'price': 0,
              'features': [
                '2 social accounts',
                '20 posts/month',
                '50 AI credits',
                'Basic analytics',
              ],
            },
            {
              'id': 'starter',
              'name': 'Starter',
              'price': 9.99,
              'features': [
                '5 social accounts',
                '100 posts/month',
                '200 AI credits',
                'Advanced analytics',
                'Scheduled posts',
              ],
            },
            {
              'id': 'professional',
              'name': 'Professional',
              'price': 29.99,
              'features': [
                '15 social accounts',
                'Unlimited posts',
                '1000 AI credits',
                'Priority support',
                'Team collaboration',
                'Custom integrations',
              ],
            },
            {
              'id': 'enterprise',
              'name': 'Enterprise',
              'price': 99.99,
              'features': [
                'Unlimited accounts',
                'Unlimited posts',
                'Unlimited AI credits',
                '24/7 support',
                'Dedicated manager',
                'Custom features',
                'API access',
              ],
            },
          ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: MediaQuery.of(context).size.width > 800 ? 4 : 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.65,
      ),
      itemCount: plans.length,
      itemBuilder: (context, index) {
        final plan = plans[index];
        final currentPlan =
            state.currentSubscription?['plan'] ?? 'free';
        final isCurrentPlan = plan['id'] == currentPlan;

        return _PlanCard(
          plan: plan,
          isCurrentPlan: isCurrentPlan,
          isLoading: state.isSubscribing,
          onSubscribe: () {
            context.read<SubscriptionBloc>().add(
                  SubscribeToPlan(plan['id']),
                );
          },
        );
      },
    );
  }

  Widget _buildBillingHistory(
    BuildContext context,
    SubscriptionState state,
  ) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: state.billingHistory.length,
      separatorBuilder: (_, __) => Divider(color: AppColors.grey200),
      itemBuilder: (context, index) {
        final invoice = state.billingHistory[index];
        return ListTile(
          leading: Icon(
            Iconsax.receipt,
            color: AppColors.primary,
          ),
          title: Text(invoice['description'] ?? 'Invoice'),
          subtitle: Text(_formatDate(invoice['date'])),
          trailing: Text(
            '\$${(invoice['amount'] ?? 0).toStringAsFixed(2)}',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: AppColors.success,
            ),
          ),
        );
      },
    );
  }

  String _getPlanName(String plan) {
    switch (plan.toLowerCase()) {
      case 'starter':
        return 'Starter';
      case 'professional':
        return 'Professional';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Free';
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancel Subscription'),
        content: const Text(
          'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of the billing period.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Keep Subscription'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            onPressed: () {
              context.read<SubscriptionBloc>().add(CancelSubscription());
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
}

class _UsageBar extends StatelessWidget {
  final String label;
  final int current;
  final int limit;
  final Color color;

  const _UsageBar({
    required this.label,
    required this.current,
    required this.limit,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final progress = limit > 0 ? (current / limit).clamp(0.0, 1.0) : 0.0;
    final isNearLimit = progress > 0.8;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey600,
              ),
            ),
            Text(
              '$current / $limit',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isNearLimit ? AppColors.warning : AppColors.grey700,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: AppColors.grey200,
            valueColor: AlwaysStoppedAnimation<Color>(
              isNearLimit ? AppColors.warning : color,
            ),
            minHeight: 8,
          ),
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  final Map<String, dynamic> plan;
  final bool isCurrentPlan;
  final bool isLoading;
  final VoidCallback onSubscribe;

  const _PlanCard({
    required this.plan,
    required this.isCurrentPlan,
    required this.isLoading,
    required this.onSubscribe,
  });

  @override
  Widget build(BuildContext context) {
    final features = List<String>.from(plan['features'] ?? []);
    final price = plan['price'] ?? 0;
    // Show max 4 features to prevent overflow
    final displayFeatures = features.take(4).toList();
    final moreCount = features.length - displayFeatures.length;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCurrentPlan
            ? AppColors.primary.withOpacity(0.05)
            : Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCurrentPlan ? AppColors.primary : AppColors.grey200,
          width: isCurrentPlan ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isCurrentPlan)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'CURRENT',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          SizedBox(height: isCurrentPlan ? 8 : 0),
          Text(
            plan['name'] ?? '',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: '\$${price.toStringAsFixed(0)}',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                TextSpan(
                  text: '/mo',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.grey500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...displayFeatures.map((feature) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Iconsax.tick_circle,
                          size: 12,
                          color: AppColors.success,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            feature,
                            style: TextStyle(
                              fontSize: 10,
                              color: AppColors.grey600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                if (moreCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      '+$moreCount more',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: isCurrentPlan
                ? OutlinedButton(
                    onPressed: null,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    child: const Text('Current Plan', style: TextStyle(fontSize: 12)),
                  )
                : ElevatedButton(
                    onPressed: isLoading ? null : onSubscribe,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    child: isLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Subscribe', style: TextStyle(fontSize: 12)),
                  ),
          ),
        ],
      ),
    );
  }
}
