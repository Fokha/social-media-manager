import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/api_service.dart';
import '../../../../services/injection.dart';
import '../bloc/dashboard_bloc.dart';
import '../widgets/stat_card.dart';
import '../widgets/account_card.dart';
import '../widgets/post_card.dart';
import '../widgets/quick_action_card.dart';
import '../widgets/analytics_chart.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<DashboardBloc>()..add(LoadDashboardData()),
      child: const _DashboardView(),
    );
  }
}

class _DashboardView extends StatelessWidget {
  const _DashboardView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Hello, Admin!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            Text(
              'Here\'s your overview',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.grey500,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.notification),
            onPressed: () => _showNotificationsDialog(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, state) {
          if (state.isLoading && state.stats == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<DashboardBloc>().add(RefreshDashboardData());
            },
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stats Grid
                  _buildStatsGrid(context, state),
                  const SizedBox(height: 24),

                  // Analytics Chart
                  const AnalyticsChart(),
                  const SizedBox(height: 24),

                  // Quick Actions
                  Text(
                    'Quick Actions',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  _buildQuickActions(context),
                  const SizedBox(height: 24),

                  // Trending Hashtags Section
                  Text(
                    'Trending #Hashtags',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  _buildTrendingHashtags(context),
                  const SizedBox(height: 24),

                  // Recent Mentions Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '@Mentions',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      TextButton(
                        onPressed: () => context.go('/messages'),
                        child: const Text('See All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildMentionsList(context, state),
                  const SizedBox(height: 24),

                  // Connected Accounts
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Connected Accounts',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      TextButton(
                        onPressed: () => context.go('/accounts'),
                        child: const Text('See All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildAccountsList(context, state),
                  const SizedBox(height: 24),

                  // Recent Posts
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recent Posts',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      TextButton(
                        onPressed: () => context.go('/posts'),
                        child: const Text('See All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildPostsList(context, state),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/posts/create'),
        icon: const Icon(Iconsax.add),
        label: const Text('New Post'),
      ),
    );
  }

  Widget _buildTrendingHashtags(BuildContext context) {
    // Sample trending hashtags - in real app, this would come from state
    final trendingTags = [
      {'tag': '#marketing', 'count': '2.4K', 'trend': 'up'},
      {'tag': '#socialmedia', 'count': '1.8K', 'trend': 'up'},
      {'tag': '#business', 'count': '1.2K', 'trend': 'down'},
      {'tag': '#digital', 'count': '956', 'trend': 'up'},
      {'tag': '#content', 'count': '823', 'trend': 'stable'},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        children: [
          // Tab selector for Latest, Mentioned, Top
          Row(
            children: [
              _HashtagTab(label: 'Top', isSelected: true),
              const SizedBox(width: 8),
              _HashtagTab(label: 'Latest', isSelected: false),
              const SizedBox(width: 8),
              _HashtagTab(label: 'Mentioned', isSelected: false),
            ],
          ),
          const SizedBox(height: 16),
          // Hashtag list
          ...trendingTags.map((tag) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    tag['tag']!,
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${tag['count']} posts',
                  style: TextStyle(
                    color: AppColors.grey500,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Icon(
                  tag['trend'] == 'up'
                    ? Iconsax.arrow_up_1
                    : tag['trend'] == 'down'
                      ? Iconsax.arrow_down
                      : Iconsax.minus,
                  size: 16,
                  color: tag['trend'] == 'up'
                    ? AppColors.success
                    : tag['trend'] == 'down'
                      ? AppColors.error
                      : AppColors.grey500,
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildMentionsList(BuildContext context, DashboardState state) {
    // Sample mentions - in real app, this would come from state
    final mentions = [
      {'user': '@techbrand', 'message': 'Great post! We love your content strategy.', 'time': '2h ago', 'platform': 'twitter'},
      {'user': '@marketingpro', 'message': 'Thanks for the shoutout!', 'time': '5h ago', 'platform': 'instagram'},
      {'user': '@digitalagency', 'message': 'Would love to collaborate on a project.', 'time': '1d ago', 'platform': 'linkedin'},
    ];

    if (mentions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.grey200),
        ),
        child: Column(
          children: [
            Icon(Iconsax.message_notif, size: 40, color: AppColors.grey300),
            const SizedBox(height: 12),
            Text(
              'No recent mentions',
              style: TextStyle(color: AppColors.grey500),
            ),
          ],
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
        itemCount: mentions.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.grey100),
        itemBuilder: (context, index) {
          final mention = mentions[index];
          return ListTile(
            leading: CircleAvatar(
              radius: 18,
              backgroundColor: _getPlatformColor(mention['platform']!).withOpacity(0.1),
              child: Icon(
                _getPlatformIcon(mention['platform']!),
                size: 18,
                color: _getPlatformColor(mention['platform']!),
              ),
            ),
            title: Row(
              children: [
                Text(
                  mention['user']!,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  mention['time']!,
                  style: TextStyle(
                    color: AppColors.grey400,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
            subtitle: Text(
              mention['message']!,
              style: const TextStyle(fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: IconButton(
              icon: Icon(Iconsax.message, size: 18, color: AppColors.grey500),
              onPressed: () => context.go('/messages'),
            ),
          );
        },
      ),
    );
  }

  IconData _getPlatformIcon(String platform) {
    switch (platform) {
      case 'twitter':
        return Iconsax.message;
      case 'instagram':
        return Iconsax.instagram;
      case 'linkedin':
        return Iconsax.link;
      case 'facebook':
        return Iconsax.share;
      default:
        return Iconsax.global;
    }
  }

  Color _getPlatformColor(String platform) {
    switch (platform) {
      case 'twitter':
        return AppColors.twitter;
      case 'instagram':
        return AppColors.instagram;
      case 'linkedin':
        return AppColors.linkedin;
      case 'facebook':
        return const Color(0xFF1877F2);
      default:
        return AppColors.grey500;
    }
  }

  Widget _buildStatsGrid(BuildContext context, DashboardState state) {
    final stats = state.stats;

    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = constraints.maxWidth > 600 ? 4 : 2;

        return GridView.count(
          crossAxisCount: crossAxisCount,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.4,
          children: [
            StatCard(
              title: 'Accounts',
              value: '${stats?.totalAccounts ?? 0}',
              subtitle: 'of ${stats?.accountsLimit ?? 2}',
              icon: Iconsax.user_octagon,
              color: AppColors.primary,
              progress: stats != null
                  ? stats.totalAccounts / stats.accountsLimit
                  : 0,
            ),
            StatCard(
              title: 'Posts',
              value: '${stats?.postsThisMonth ?? 0}',
              subtitle: 'this month',
              icon: Iconsax.document_text,
              color: AppColors.secondary,
              progress: stats != null && stats.postsLimit > 0
                  ? stats.postsThisMonth / stats.postsLimit
                  : 0,
            ),
            StatCard(
              title: 'Messages',
              value: '${state.unreadMessages}',
              subtitle: 'unread',
              icon: Iconsax.message,
              color: AppColors.accent,
            ),
            StatCard(
              title: 'AI Credits',
              value: '${stats?.aiCreditsUsed ?? 0}',
              subtitle: 'of ${stats?.aiCreditsLimit ?? 50}',
              icon: Iconsax.cpu,
              color: AppColors.info,
              progress: stats != null && stats.aiCreditsLimit > 0
                  ? stats.aiCreditsUsed / stats.aiCreditsLimit
                  : 0,
            ),
          ],
        );
      },
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          QuickActionCard(
            title: 'Create Post',
            icon: Iconsax.edit,
            color: AppColors.primary,
            onTap: () => context.go('/posts/create'),
          ),
          const SizedBox(width: 12),
          QuickActionCard(
            title: 'Find Me',
            icon: Iconsax.search_normal,
            color: AppColors.warning,
            onTap: () => _showFindMeDialog(context),
          ),
          const SizedBox(width: 12),
          QuickActionCard(
            title: 'View Messages',
            icon: Iconsax.message,
            color: AppColors.accent,
            onTap: () => context.go('/messages'),
          ),
          const SizedBox(width: 12),
          QuickActionCard(
            title: 'Add Account',
            icon: Iconsax.add_circle,
            color: AppColors.secondary,
            onTap: () => context.go('/accounts'),
          ),
          const SizedBox(width: 12),
          QuickActionCard(
            title: 'AI Assistant',
            icon: Iconsax.cpu,
            color: AppColors.info,
            onTap: () => _showAIAssistantDialog(context),
          ),
        ],
      ),
    );
  }

  void _showFindMeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => _FindMeDialog(),
    );
  }

  void _showNotificationsDialog(BuildContext context) {
    final notifications = [
      {'title': 'New follower on Instagram', 'time': '5m ago', 'icon': Iconsax.instagram, 'read': false},
      {'title': 'Your post reached 1K likes', 'time': '1h ago', 'icon': Iconsax.heart, 'read': false},
      {'title': 'New message from @techbrand', 'time': '2h ago', 'icon': Iconsax.message, 'read': true},
      {'title': 'Scheduled post published', 'time': '3h ago', 'icon': Iconsax.tick_circle, 'read': true},
      {'title': 'AI credits running low', 'time': '1d ago', 'icon': Iconsax.cpu, 'read': true},
    ];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Text('Notifications'),
            const Spacer(),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All notifications marked as read')),
                );
              },
              child: const Text('Mark all read'),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: notifications.length,
            itemBuilder: (context, index) {
              final notif = notifications[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: (notif['read'] as bool)
                      ? AppColors.grey100
                      : AppColors.primary.withValues(alpha: 0.1),
                  child: Icon(
                    notif['icon'] as IconData,
                    size: 18,
                    color: (notif['read'] as bool) ? AppColors.grey500 : AppColors.primary,
                  ),
                ),
                title: Text(
                  notif['title'] as String,
                  style: TextStyle(
                    fontWeight: (notif['read'] as bool) ? FontWeight.normal : FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                subtitle: Text(notif['time'] as String, style: const TextStyle(fontSize: 12)),
                trailing: (notif['read'] as bool)
                    ? null
                    : Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.go('/settings');
            },
            child: const Text('Settings'),
          ),
        ],
      ),
    );
  }

  void _showAIAssistantDialog(BuildContext context) {
    final textController = TextEditingController();
    bool isGenerating = false;
    String aiResponse = '';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setOuterState) {
          return AlertDialog(
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Iconsax.cpu, color: AppColors.info),
                ),
                const SizedBox(width: 12),
                const Text('AI Assistant'),
              ],
            ),
            content: SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'How can I help you today?',
                    style: TextStyle(color: AppColors.grey600),
                  ),
                  const SizedBox(height: 16),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 2.8,
                    children: [
                      _AIQuickAction(
                        label: 'Generate post',
                        icon: Iconsax.edit,
                        onTap: () {
                          textController.text = 'Generate a social media post about: ';
                        },
                      ),
                      _AIQuickAction(
                        label: 'Improve content',
                        icon: Iconsax.magic_star,
                        onTap: () {
                          textController.text = 'Improve this content: ';
                        },
                      ),
                      _AIQuickAction(
                        label: 'Generate hashtags',
                        icon: Iconsax.hashtag,
                        onTap: () {
                          textController.text = 'Generate hashtags for: ';
                        },
                      ),
                      _AIQuickAction(
                        label: 'Reply suggestion',
                        icon: Iconsax.message,
                        onTap: () {
                          textController.text = 'Suggest a reply to: ';
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: textController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Ask me anything...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  StatefulBuilder(
                    builder: (context, setDialogState) {
                      return Column(
                        children: [
                          if (aiResponse.isNotEmpty) ...[
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.success.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.success.withOpacity(0.3)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Iconsax.cpu, size: 16, color: AppColors.success),
                                      const SizedBox(width: 8),
                                      Text(
                                        'AI Response:',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.success,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(aiResponse),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                          if (isGenerating)
                            Container(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.info,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'AI is thinking...',
                                    style: TextStyle(color: AppColors.info),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              ElevatedButton.icon(
                onPressed: isGenerating
                    ? null
                    : () async {
                        if (textController.text.isNotEmpty) {
                          setOuterState(() => isGenerating = true);

                          // Call AI API
                          try {
                            final apiService = getIt<ApiService>();
                            final response = await apiService.generateContent(
                              prompt: textController.text,
                            );
                            final content = response.data['data']['content'] as String? ?? 'No response generated';
                            setOuterState(() {
                              aiResponse = content;
                              isGenerating = false;
                            });
                          } catch (e) {
                            setOuterState(() {
                              aiResponse = 'Generated content for: "${textController.text}"\n\nThis is a demo response. Connect your OpenAI API key in Admin settings for real AI generation.';
                              isGenerating = false;
                            });
                          }
                        }
                      },
                icon: const Icon(Iconsax.send_1, size: 18),
                label: Text(isGenerating ? 'Generating...' : 'Generate'),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAccountsList(BuildContext context, DashboardState state) {
    if (state.accounts.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(
                Iconsax.user_add,
                size: 40,
                color: AppColors.grey300,
              ),
              const SizedBox(height: 12),
              Text(
                'No accounts connected',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => context.go('/accounts'),
                child: const Text('Connect Account'),
              ),
            ],
          ),
        ),
      );
    }

    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: state.accounts.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final account = state.accounts[index];
          return AccountCard(account: account);
        },
      ),
    );
  }

  Widget _buildPostsList(BuildContext context, DashboardState state) {
    if (state.recentPosts.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(
                Iconsax.document,
                size: 40,
                color: AppColors.grey300,
              ),
              const SizedBox(height: 12),
              Text(
                'No posts yet',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => context.go('/posts/create'),
                child: const Text('Create Post'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: state.recentPosts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final post = state.recentPosts[index];
        return PostCard(post: post);
      },
    );
  }
}

class _HashtagTab extends StatelessWidget {
  final String label;
  final bool isSelected;

  const _HashtagTab({
    required this.label,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primary : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isSelected ? AppColors.primary : AppColors.grey300,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppColors.grey600,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _FindMeDialog extends StatefulWidget {
  @override
  State<_FindMeDialog> createState() => _FindMeDialogState();
}

class _FindMeDialogState extends State<_FindMeDialog> {
  bool _isSearching = false;
  List<_FindMeResult> _results = [];
  final Set<String> _selectedPlatforms = {'twitter', 'instagram', 'linkedin', 'facebook'};

  final _platforms = [
    {'id': 'twitter', 'name': 'Twitter/X', 'icon': Iconsax.message},
    {'id': 'instagram', 'name': 'Instagram', 'icon': Iconsax.instagram},
    {'id': 'linkedin', 'name': 'LinkedIn', 'icon': Iconsax.link},
    {'id': 'facebook', 'name': 'Facebook', 'icon': Iconsax.share},
  ];

  void _startSearch() async {
    setState(() {
      _isSearching = true;
      _results = [];
    });

    // Simulate crawling across platforms
    await Future.delayed(const Duration(milliseconds: 500));

    // Mock results - in production, this would call real APIs
    final mockResults = [
      _FindMeResult(
        platform: 'twitter',
        type: 'mention',
        content: '@yourbrand was mentioned in a viral thread about marketing trends',
        author: '@techinfluencer',
        engagement: '2.4K likes',
        time: '2h ago',
      ),
      _FindMeResult(
        platform: 'instagram',
        type: 'tag',
        content: 'Your brand was tagged in 5 new posts today',
        author: 'Multiple users',
        engagement: '1.2K total reach',
        time: '4h ago',
      ),
      _FindMeResult(
        platform: 'linkedin',
        type: 'article',
        content: 'Your company was featured in an industry analysis article',
        author: 'Marketing Weekly',
        engagement: '856 views',
        time: '1d ago',
      ),
      _FindMeResult(
        platform: 'twitter',
        type: 'reply',
        content: 'Active discussion thread about your latest product launch',
        author: '@productreviewer',
        engagement: '342 replies',
        time: '6h ago',
      ),
      _FindMeResult(
        platform: 'facebook',
        type: 'share',
        content: 'Your post was shared in 3 relevant groups',
        author: 'Group members',
        engagement: '567 reach',
        time: '12h ago',
      ),
    ];

    await Future.delayed(const Duration(milliseconds: 1500));

    setState(() {
      _isSearching = false;
      _results = mockResults.where((r) => _selectedPlatforms.contains(r.platform)).toList();
    });
  }

  Color _getPlatformColor(String platform) {
    switch (platform) {
      case 'twitter':
        return AppColors.twitter;
      case 'instagram':
        return AppColors.instagram;
      case 'linkedin':
        return AppColors.linkedin;
      case 'facebook':
        return const Color(0xFF1877F2);
      default:
        return AppColors.grey500;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'mention':
        return Iconsax.message_text;
      case 'tag':
        return Iconsax.tag;
      case 'article':
        return Iconsax.document_text;
      case 'reply':
        return Iconsax.message_2;
      case 'share':
        return Iconsax.share;
      default:
        return Iconsax.global;
    }
  }

  void _exportResults(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Export Results'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Iconsax.document_text),
              title: const Text('Export as CSV'),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Results exported as CSV')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Iconsax.document),
              title: const Text('Export as PDF'),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Results exported as PDF')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Iconsax.copy),
              title: const Text('Copy to Clipboard'),
              onTap: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Results copied to clipboard')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showResultDetails(BuildContext context, _FindMeResult result) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: _getPlatformColor(result.platform).withValues(alpha: 0.1),
              child: Icon(
                _getTypeIcon(result.type),
                color: _getPlatformColor(result.platform),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                result.type.toUpperCase(),
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(result.content),
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(Iconsax.user, size: 16, color: AppColors.grey500),
                const SizedBox(width: 8),
                Text(result.author, style: TextStyle(color: _getPlatformColor(result.platform))),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Iconsax.chart, size: 16, color: AppColors.grey500),
                const SizedBox(width: 8),
                Text(result.engagement),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Iconsax.clock, size: 16, color: AppColors.grey500),
                const SizedBox(width: 8),
                Text(result.time),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Opening in browser...')),
              );
            },
            icon: const Icon(Iconsax.export_3, size: 16),
            label: const Text('View Original'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.warning, AppColors.warning.withOpacity(0.8)],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Iconsax.search_normal, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Find Me',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Discover mentions across social media',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Platform Selection
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Search Platforms',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: AppColors.grey700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _platforms.map((platform) {
                      final isSelected = _selectedPlatforms.contains(platform['id']);
                      return FilterChip(
                        selected: isSelected,
                        label: Text(platform['name'] as String),
                        avatar: Icon(
                          platform['icon'] as IconData,
                          size: 16,
                          color: isSelected ? Colors.white : _getPlatformColor(platform['id'] as String),
                        ),
                        selectedColor: _getPlatformColor(platform['id'] as String),
                        checkmarkColor: Colors.white,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppColors.grey700,
                          fontSize: 12,
                        ),
                        onSelected: (selected) {
                          setState(() {
                            if (selected) {
                              _selectedPlatforms.add(platform['id'] as String);
                            } else {
                              _selectedPlatforms.remove(platform['id'] as String);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            // Search Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _selectedPlatforms.isEmpty || _isSearching ? null : _startSearch,
                  icon: _isSearching
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Iconsax.radar),
                  label: Text(_isSearching ? 'Crawling...' : 'Start Crawling'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.warning,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Results
            if (_results.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Text(
                      'Found ${_results.length} results',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.grey700,
                      ),
                    ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () => _exportResults(context),
                      icon: const Icon(Iconsax.export_1, size: 16),
                      label: const Text('Export'),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _results.length,
                  itemBuilder: (context, index) {
                    final result = _results[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: _getPlatformColor(result.platform).withOpacity(0.1),
                          child: Icon(
                            _getTypeIcon(result.type),
                            color: _getPlatformColor(result.platform),
                            size: 20,
                          ),
                        ),
                        title: Text(
                          result.content,
                          style: const TextStyle(fontSize: 13),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Row(
                          children: [
                            Text(
                              result.author,
                              style: TextStyle(
                                color: _getPlatformColor(result.platform),
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${result.engagement} • ${result.time}',
                              style: TextStyle(color: AppColors.grey500, fontSize: 11),
                            ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: Icon(Iconsax.arrow_right_3, size: 18, color: AppColors.grey500),
                          onPressed: () => _showResultDetails(context, result),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ] else if (!_isSearching) ...[
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Iconsax.search_status, size: 48, color: AppColors.grey300),
                      const SizedBox(height: 12),
                      Text(
                        'Select platforms and start crawling',
                        style: TextStyle(color: AppColors.grey500),
                      ),
                      Text(
                        'to find mentions of your accounts',
                        style: TextStyle(color: AppColors.grey400, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircularProgressIndicator(),
                      const SizedBox(height: 16),
                      Text(
                        'Searching across platforms...',
                        style: TextStyle(color: AppColors.grey500),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Finding mentions, tags, and shares',
                        style: TextStyle(color: AppColors.grey400, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FindMeResult {
  final String platform;
  final String type;
  final String content;
  final String author;
  final String engagement;
  final String time;

  _FindMeResult({
    required this.platform,
    required this.type,
    required this.content,
    required this.author,
    required this.engagement,
    required this.time,
  });
}

class _AIQuickAction extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _AIQuickAction({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.info.withOpacity(0.05),
          border: Border.all(color: AppColors.info.withOpacity(0.2)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: AppColors.info.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Center(
                child: Icon(icon, size: 14, color: AppColors.info),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.grey700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
