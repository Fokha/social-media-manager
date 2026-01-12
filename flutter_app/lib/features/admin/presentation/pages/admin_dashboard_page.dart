import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../bloc/admin_bloc.dart';

class AdminDashboardPage extends StatelessWidget {
  const AdminDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<AdminBloc>()..add(LoadAdminDashboard()),
      child: const _AdminDashboardView(),
    );
  }
}

class _AdminDashboardView extends StatelessWidget {
  const _AdminDashboardView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.refresh),
            onPressed: () {
              context.read<AdminBloc>().add(LoadAdminDashboard());
            },
          ),
        ],
      ),
      body: BlocConsumer<AdminBloc, AdminState>(
        listener: (context, state) {
          if (state.error != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.error!),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state.isLoading && state.dashboardStats.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          final stats = state.dashboardStats;

          return RefreshIndicator(
            onRefresh: () async {
              context.read<AdminBloc>().add(LoadAdminDashboard());
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Overview Stats
                  Text(
                    'Platform Overview',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  _buildStatsGrid(context, stats),
                  const SizedBox(height: 24),

                  // Revenue Section
                  Text(
                    'Revenue',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  _buildRevenueCard(context, stats),
                  const SizedBox(height: 24),

                  // API Usage Section
                  Text(
                    'API Usage (This Month)',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  _buildApiUsageCard(context, stats),
                  const SizedBox(height: 24),

                  // Recent Activity
                  Text(
                    'Recent Activity',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  _buildRecentActivity(context, stats),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatsGrid(BuildContext context, Map<String, dynamic> stats) {
    return GridView.count(
      crossAxisCount: MediaQuery.of(context).size.width > 600 ? 4 : 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _StatCard(
          title: 'Total Users',
          value: '${stats['totalUsers'] ?? 0}',
          subtitle: '+${stats['newUsersThisMonth'] ?? 0} this month',
          icon: Iconsax.people,
          color: AppColors.primary,
        ),
        _StatCard(
          title: 'Active Accounts',
          value: '${stats['totalAccounts'] ?? 0}',
          subtitle: 'across all users',
          icon: Iconsax.user_octagon,
          color: AppColors.secondary,
        ),
        _StatCard(
          title: 'Total Posts',
          value: '${stats['totalPosts'] ?? 0}',
          subtitle: '${stats['postsThisMonth'] ?? 0} this month',
          icon: Iconsax.document_text,
          color: AppColors.accent,
        ),
        _StatCard(
          title: 'Active Subs',
          value: '${stats['activeSubscriptions'] ?? 0}',
          subtitle: 'paid users',
          icon: Iconsax.wallet,
          color: AppColors.success,
        ),
      ],
    );
  }

  Widget _buildRevenueCard(BuildContext context, Map<String, dynamic> stats) {
    final mrr = stats['monthlyRecurringRevenue'] ?? 0.0;
    final totalRevenue = stats['totalRevenue'] ?? 0.0;
    final revenueGrowth = stats['revenueGrowth'] ?? 0.0;

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
                      'Monthly Recurring Revenue',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '\$${mrr.toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: revenueGrowth >= 0
                      ? Colors.green.withOpacity(0.2)
                      : Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      revenueGrowth >= 0
                          ? Iconsax.arrow_up_1
                          : Iconsax.arrow_down,
                      color: Colors.white,
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${revenueGrowth.abs().toStringAsFixed(1)}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: Colors.white.withOpacity(0.2)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _RevenueMetric(
                label: 'Total Revenue',
                value: '\$${totalRevenue.toStringAsFixed(2)}',
              ),
              _RevenueMetric(
                label: 'Avg. per User',
                value: stats['totalUsers'] != null && stats['totalUsers'] > 0
                    ? '\$${(totalRevenue / stats['totalUsers']).toStringAsFixed(2)}'
                    : '\$0.00',
              ),
              _RevenueMetric(
                label: 'Churn Rate',
                value: '${stats['churnRate'] ?? 0}%',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildApiUsageCard(BuildContext context, Map<String, dynamic> stats) {
    final apiUsage = stats['apiUsage'] as Map<String, dynamic>? ?? {};

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ApiUsageRow(
            provider: 'OpenAI',
            icon: Iconsax.cpu,
            usage: apiUsage['openai']?.toString() ?? '0',
            cost: '\$${(apiUsage['openaiCost'] ?? 0).toStringAsFixed(2)}',
            color: AppColors.info,
          ),
          Divider(height: 24, color: AppColors.grey200),
          _ApiUsageRow(
            provider: 'Instagram API',
            icon: Iconsax.instagram,
            usage: apiUsage['instagram']?.toString() ?? '0',
            cost: '\$${(apiUsage['instagramCost'] ?? 0).toStringAsFixed(2)}',
            color: AppColors.instagram,
          ),
          Divider(height: 24, color: AppColors.grey200),
          _ApiUsageRow(
            provider: 'Twitter API',
            icon: Iconsax.message,
            usage: apiUsage['twitter']?.toString() ?? '0',
            cost: '\$${(apiUsage['twitterCost'] ?? 0).toStringAsFixed(2)}',
            color: AppColors.twitter,
          ),
          Divider(height: 24, color: AppColors.grey200),
          _ApiUsageRow(
            provider: 'LinkedIn API',
            icon: Iconsax.link,
            usage: apiUsage['linkedin']?.toString() ?? '0',
            cost: '\$${(apiUsage['linkedinCost'] ?? 0).toStringAsFixed(2)}',
            color: AppColors.linkedin,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warning.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Iconsax.wallet, color: AppColors.warning),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Total API Costs This Month',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: AppColors.warning,
                    ),
                  ),
                ),
                Text(
                  '\$${(apiUsage['totalCost'] ?? 0).toStringAsFixed(2)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.warning,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity(
    BuildContext context,
    Map<String, dynamic> stats,
  ) {
    final activities = List<Map<String, dynamic>>.from(
      stats['recentActivities'] ?? [],
    );

    if (activities.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.grey200),
        ),
        child: Center(
          child: Text(
            'No recent activity',
            style: TextStyle(color: AppColors.grey500),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: activities.length.clamp(0, 10),
        separatorBuilder: (_, __) => Divider(
          height: 1,
          color: AppColors.grey100,
        ),
        itemBuilder: (context, index) {
          final activity = activities[index];
          return ListTile(
            leading: _getActivityIcon(activity['type']),
            title: Text(activity['description'] ?? ''),
            subtitle: Text(activity['time'] ?? ''),
            trailing: activity['amount'] != null
                ? Text(
                    '\$${activity['amount']}',
                    style: TextStyle(
                      color: AppColors.success,
                      fontWeight: FontWeight.w600,
                    ),
                  )
                : null,
          );
        },
      ),
    );
  }

  Widget _getActivityIcon(String? type) {
    IconData icon;
    Color color;

    switch (type) {
      case 'subscription':
        icon = Iconsax.wallet;
        color = AppColors.success;
        break;
      case 'user':
        icon = Iconsax.user_add;
        color = AppColors.primary;
        break;
      case 'post':
        icon = Iconsax.document_text;
        color = AppColors.secondary;
        break;
      default:
        icon = Iconsax.activity;
        color = AppColors.grey500;
    }

    return CircleAvatar(
      radius: 20,
      backgroundColor: color.withOpacity(0.1),
      child: Icon(icon, color: color, size: 20),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(height: 6),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 10,
              color: AppColors.grey600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 9,
              color: AppColors.grey400,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _RevenueMetric extends StatelessWidget {
  final String label;
  final String value;

  const _RevenueMetric({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

class _ApiUsageRow extends StatelessWidget {
  final String provider;
  final IconData icon;
  final String usage;
  final String cost;
  final Color color;

  const _ApiUsageRow({
    required this.provider,
    required this.icon,
    required this.usage,
    required this.cost,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                provider,
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '$usage requests',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.grey500,
                ),
              ),
            ],
          ),
        ),
        Text(
          cost,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: AppColors.grey700,
          ),
        ),
      ],
    );
  }
}
