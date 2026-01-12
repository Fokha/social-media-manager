import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../../../dashboard/presentation/widgets/post_card.dart';
import '../bloc/posts_bloc.dart';

class PostsPage extends StatefulWidget {
  const PostsPage({super.key});

  @override
  State<PostsPage> createState() => _PostsPageState();
}

class _PostsPageState extends State<PostsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _filters = ['all', 'draft', 'scheduled', 'published', 'failed'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _filters.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<PostsBloc>()..add(const LoadPosts()),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Posts'),
          bottom: TabBar(
            controller: _tabController,
            isScrollable: true,
            tabs: _filters.map((f) {
              return Tab(text: f[0].toUpperCase() + f.substring(1));
            }).toList(),
            onTap: (index) {
              final status = index == 0 ? null : _filters[index];
              context.read<PostsBloc>().add(LoadPosts(status: status));
            },
          ),
          actions: [
            IconButton(
              icon: const Icon(Iconsax.refresh),
              onPressed: () {
                context.read<PostsBloc>().add(RefreshPosts());
              },
            ),
          ],
        ),
        body: BlocConsumer<PostsBloc, PostsState>(
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
          },
          builder: (context, state) {
            if (state.isLoading && state.posts.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            return TabBarView(
              controller: _tabController,
              children: _filters.map((filter) {
                final filteredPosts = filter == 'all'
                    ? state.posts
                    : state.posts
                        .where((p) =>
                            p['status']?.toLowerCase() == filter.toLowerCase())
                        .toList();

                if (filteredPosts.isEmpty) {
                  return _buildEmptyState(context, filter);
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    context.read<PostsBloc>().add(RefreshPosts());
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredPosts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final post = filteredPosts[index];
                      return _PostListItem(
                        post: post,
                        onDelete: () {
                          _showDeleteDialog(context, post);
                        },
                      );
                    },
                  ),
                );
              }).toList(),
            );
          },
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.go('/posts/create'),
          icon: const Icon(Iconsax.add),
          label: const Text('New Post'),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, String filter) {
    String title;
    String subtitle;
    IconData icon;

    switch (filter) {
      case 'draft':
        title = 'No drafts';
        subtitle = 'Your draft posts will appear here';
        icon = Iconsax.document;
        break;
      case 'scheduled':
        title = 'No scheduled posts';
        subtitle = 'Schedule posts to publish them later';
        icon = Iconsax.clock;
        break;
      case 'published':
        title = 'No published posts';
        subtitle = 'Your published posts will appear here';
        icon = Iconsax.tick_circle;
        break;
      case 'failed':
        title = 'No failed posts';
        subtitle = 'Posts that failed to publish will appear here';
        icon = Iconsax.close_circle;
        break;
      default:
        title = 'No posts yet';
        subtitle = 'Create your first post to get started';
        icon = Iconsax.document_text;
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48, color: AppColors.grey300),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(color: AppColors.grey500),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.go('/posts/create'),
            icon: const Icon(Iconsax.add),
            label: const Text('Create Post'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, Map<String, dynamic> post) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete Post'),
        content: const Text(
          'Are you sure you want to delete this post? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            onPressed: () {
              context.read<PostsBloc>().add(DeletePost(post['id']));
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _PostListItem extends StatelessWidget {
  final Map<String, dynamic> post;
  final VoidCallback onDelete;

  const _PostListItem({
    required this.post,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(post['id'].toString()),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Iconsax.trash, color: Colors.white),
      ),
      confirmDismiss: (_) async {
        onDelete();
        return false;
      },
      child: PostCard(post: post),
    );
  }
}
