import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../../../accounts/presentation/bloc/accounts_bloc.dart';
import '../bloc/posts_bloc.dart';

class CreatePostPage extends StatefulWidget {
  const CreatePostPage({super.key});

  @override
  State<CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends State<CreatePostPage> {
  final _contentController = TextEditingController();
  final _aiPromptController = TextEditingController();
  final Set<String> _selectedPlatforms = {};
  DateTime? _scheduledAt;
  bool _showAIPanel = false;
  final List<Map<String, dynamic>> _selectedMedia = [];

  @override
  void dispose() {
    _contentController.dispose();
    _aiPromptController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => getIt<PostsBloc>()),
        BlocProvider(create: (_) => getIt<AccountsBloc>()..add(LoadAccounts())),
      ],
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Create Post'),
          actions: [
            TextButton(
              onPressed: () => _saveDraft(context),
              child: const Text('Save Draft'),
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
              context.go('/posts');
            }
            if (state.generatedContent != null) {
              _contentController.text = state.generatedContent!;
              setState(() => _showAIPanel = false);
            }
          },
          builder: (context, postsState) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Platform Selection
                  Text(
                    'Select Platforms',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  BlocBuilder<AccountsBloc, AccountsState>(
                    builder: (context, accountsState) {
                      if (accountsState.accounts.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.warning.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.warning.withOpacity(0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(Iconsax.warning_2, color: AppColors.warning),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'No accounts connected. Connect accounts first.',
                                  style: TextStyle(color: AppColors.warning),
                                ),
                              ),
                              TextButton(
                                onPressed: () => context.go('/accounts'),
                                child: const Text('Connect'),
                              ),
                            ],
                          ),
                        );
                      }

                      return Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: accountsState.accounts.map((account) {
                          final platform = account['platform'] as String;
                          final isSelected = _selectedPlatforms.contains(
                            account['id'],
                          );

                          return FilterChip(
                            label: Text('@${account['username']}'),
                            avatar: _getPlatformAvatar(platform),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                if (selected) {
                                  _selectedPlatforms.add(account['id']);
                                } else {
                                  _selectedPlatforms.remove(account['id']);
                                }
                              });
                            },
                          );
                        }).toList(),
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // Content
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Content',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      TextButton.icon(
                        onPressed: () {
                          setState(() => _showAIPanel = !_showAIPanel);
                        },
                        icon: Icon(
                          Iconsax.cpu,
                          size: 18,
                          color: AppColors.info,
                        ),
                        label: Text(
                          _showAIPanel ? 'Hide AI' : 'AI Assist',
                          style: TextStyle(color: AppColors.info),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // AI Panel
                  if (_showAIPanel) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.info.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.info.withOpacity(0.2),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Iconsax.cpu,
                                color: AppColors.info,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'AI Content Generator',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.info,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _aiPromptController,
                            maxLines: 2,
                            decoration: InputDecoration(
                              hintText:
                                  'Describe what you want to post about...',
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: postsState.isGeneratingAI
                                  ? null
                                  : () {
                                      if (_aiPromptController.text.isNotEmpty) {
                                        context.read<PostsBloc>().add(
                                              GenerateAIContent(
                                                prompt:
                                                    _aiPromptController.text,
                                              ),
                                            );
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.info,
                              ),
                              child: postsState.isGeneratingAI
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text('Generate Content'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Content TextField
                  TextField(
                    controller: _contentController,
                    maxLines: 6,
                    maxLength: 2200,
                    decoration: InputDecoration(
                      hintText: 'What do you want to share?',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Media (placeholder)
                  Text(
                    'Media',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  if (_selectedMedia.isNotEmpty) ...[
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _selectedMedia.length + 1,
                        itemBuilder: (context, index) {
                          if (index == _selectedMedia.length) {
                            // Add more button
                            return InkWell(
                              onTap: () => _showMediaPicker(context),
                              child: Container(
                                width: 100,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  border: Border.all(color: AppColors.grey300),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Iconsax.add, color: AppColors.grey500),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Add more',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.grey500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }
                          final media = _selectedMedia[index];
                          return Stack(
                            children: [
                              Container(
                                width: 100,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  color: AppColors.grey100,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Icon(
                                    media['type'] == 'video'
                                        ? Iconsax.video
                                        : Iconsax.image,
                                    color: AppColors.primary,
                                    size: 32,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 4,
                                right: 12,
                                child: InkWell(
                                  onTap: () {
                                    setState(() {
                                      _selectedMedia.removeAt(index);
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: Colors.black54,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Iconsax.close_circle,
                                      size: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  ] else
                    InkWell(
                      onTap: () => _showMediaPicker(context),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 32),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: AppColors.grey300,
                            style: BorderStyle.solid,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Iconsax.image,
                              size: 32,
                              color: AppColors.grey400,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Add photos or videos',
                              style: TextStyle(color: AppColors.grey500),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),

                  // Schedule
                  Text(
                    'Schedule',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      Iconsax.clock,
                      color: _scheduledAt != null
                          ? AppColors.primary
                          : AppColors.grey500,
                    ),
                    title: Text(
                      _scheduledAt != null
                          ? DateFormat('MMM d, yyyy h:mm a')
                              .format(_scheduledAt!)
                          : 'Post now',
                    ),
                    subtitle: _scheduledAt != null
                        ? const Text('Tap to change')
                        : const Text('Tap to schedule'),
                    trailing: _scheduledAt != null
                        ? IconButton(
                            icon: const Icon(Iconsax.close_circle),
                            onPressed: () {
                              setState(() => _scheduledAt = null);
                            },
                          )
                        : null,
                    onTap: () => _selectDateTime(context),
                  ),
                  const SizedBox(height: 32),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => context.pop(),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: postsState.isCreating
                              ? null
                              : () => _publishPost(context),
                          child: postsState.isCreating
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(_scheduledAt != null
                                  ? 'Schedule Post'
                                  : 'Publish Now'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _getPlatformAvatar(String platform) {
    IconData icon;
    Color color;

    switch (platform.toLowerCase()) {
      case 'instagram':
        icon = Iconsax.instagram;
        color = AppColors.instagram;
        break;
      case 'twitter':
      case 'x':
        icon = Iconsax.message;
        color = AppColors.twitter;
        break;
      case 'linkedin':
        icon = Iconsax.link;
        color = AppColors.linkedin;
        break;
      case 'youtube':
        icon = Iconsax.video;
        color = AppColors.youtube;
        break;
      default:
        icon = Iconsax.global;
        color = AppColors.primary;
    }

    return CircleAvatar(
      radius: 12,
      backgroundColor: color.withOpacity(0.1),
      child: Icon(icon, size: 14, color: color),
    );
  }

  Future<void> _selectDateTime(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(hours: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (date != null && context.mounted) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
      );

      if (time != null) {
        setState(() {
          _scheduledAt = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  void _saveDraft(BuildContext context) {
    if (_contentController.text.isEmpty && _selectedMedia.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add some content or media')),
      );
      return;
    }

    // Save draft via PostsBloc
    context.read<PostsBloc>().add(
      SaveDraft(
        content: _contentController.text,
        platforms: _selectedPlatforms.toList(),
        scheduledAt: _scheduledAt,
        mediaCount: _selectedMedia.length,
      ),
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Draft saved successfully'),
        backgroundColor: AppColors.success,
        action: SnackBarAction(
          label: 'View Drafts',
          textColor: Colors.white,
          onPressed: () => context.go('/posts?tab=drafts'),
        ),
      ),
    );
  }

  void _showMediaPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Add Media',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  IconButton(
                    icon: const Icon(Iconsax.close_circle),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Iconsax.camera, color: AppColors.primary),
                ),
                title: const Text('Take Photo'),
                subtitle: const Text('Use camera to capture'),
                onTap: () {
                  Navigator.pop(context);
                  _addMedia('image', 'Camera photo');
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.info.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Iconsax.gallery, color: AppColors.info),
                ),
                title: const Text('Choose from Gallery'),
                subtitle: const Text('Select existing photos'),
                onTap: () {
                  Navigator.pop(context);
                  _addMedia('image', 'Gallery photo');
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.youtube.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Iconsax.video, color: AppColors.youtube),
                ),
                title: const Text('Record Video'),
                subtitle: const Text('Capture new video'),
                onTap: () {
                  Navigator.pop(context);
                  _addMedia('video', 'Recorded video');
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Iconsax.video_play, color: AppColors.secondary),
                ),
                title: const Text('Choose Video'),
                subtitle: const Text('Select existing video'),
                onTap: () {
                  Navigator.pop(context);
                  _addMedia('video', 'Gallery video');
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  void _addMedia(String type, String source) {
    if (_selectedMedia.length >= 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 10 media items allowed')),
      );
      return;
    }

    setState(() {
      _selectedMedia.add({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'type': type,
        'source': source,
      });
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$source added'),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _publishPost(BuildContext context) {
    if (_contentController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add some content')),
      );
      return;
    }

    if (_selectedPlatforms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one platform')),
      );
      return;
    }

    context.read<PostsBloc>().add(
          CreatePost(
            content: _contentController.text,
            platforms: _selectedPlatforms.toList(),
            scheduledAt: _scheduledAt,
          ),
        );
  }
}
