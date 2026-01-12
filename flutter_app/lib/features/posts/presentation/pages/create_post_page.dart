import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../../../accounts/presentation/bloc/accounts_bloc.dart';
import '../bloc/posts_bloc.dart';

class CreatePostPage extends StatefulWidget {
  final String? postId;
  final Map<String, dynamic>? initialData;

  const CreatePostPage({
    super.key,
    this.postId,
    this.initialData,
  });

  bool get isEditing => postId != null;

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

  // Loop/Recurring post settings
  bool _isLooping = false;
  String _loopFrequency = 'daily'; // daily, weekly, monthly
  int _loopCount = 3; // Number of times to repeat
  DateTime? _loopEndDate;

  @override
  void initState() {
    super.initState();
    // Pre-fill form when editing
    if (widget.isEditing && widget.initialData != null) {
      _contentController.text = widget.initialData!['content'] as String? ?? '';
      final scheduledAt = widget.initialData!['scheduledAt'];
      if (scheduledAt != null) {
        _scheduledAt = DateTime.tryParse(scheduledAt.toString());
      }
      // Pre-select the platform if available
      final socialAccount = widget.initialData!['socialAccount'] as Map<String, dynamic>?;
      if (socialAccount != null) {
        _selectedPlatforms.add(socialAccount['id'] as String);
      }
    }
  }

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
          title: Text(widget.isEditing ? 'Edit Post' : 'Create Post'),
          actions: [
            if (!widget.isEditing)
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
                          final fileName = media['name'] as String? ?? 'Media';
                          final isVideo = media['type'] == 'video';
                          return Stack(
                            children: [
                              Container(
                                width: 100,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  color: isVideo
                                      ? AppColors.youtube.withOpacity(0.1)
                                      : AppColors.info.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isVideo
                                        ? AppColors.youtube.withOpacity(0.3)
                                        : AppColors.info.withOpacity(0.3),
                                  ),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      isVideo ? Iconsax.video : Iconsax.image,
                                      color: isVideo ? AppColors.youtube : AppColors.info,
                                      size: 28,
                                    ),
                                    const SizedBox(height: 4),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 4),
                                      child: Text(
                                        fileName.length > 12
                                            ? '${fileName.substring(0, 10)}...'
                                            : fileName,
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: AppColors.grey600,
                                        ),
                                        textAlign: TextAlign.center,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
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
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('$fileName removed'),
                                        backgroundColor: AppColors.warning,
                                        duration: const Duration(seconds: 1),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
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

                  // Schedule Section
                  Text(
                    'Schedule',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.grey200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Schedule Time
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: _scheduledAt != null
                                  ? AppColors.primary.withOpacity(0.1)
                                  : AppColors.grey100,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              Iconsax.clock,
                              color: _scheduledAt != null
                                  ? AppColors.primary
                                  : AppColors.grey500,
                            ),
                          ),
                          title: Text(
                            _scheduledAt != null
                                ? DateFormat('MMM d, yyyy').format(_scheduledAt!)
                                : 'Post now',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            _scheduledAt != null
                                ? 'at ${DateFormat('h:mm a').format(_scheduledAt!)}'
                                : 'Tap to schedule for later',
                          ),
                          trailing: _scheduledAt != null
                              ? IconButton(
                                  icon: Icon(Iconsax.close_circle, color: AppColors.error),
                                  onPressed: () {
                                    setState(() {
                                      _scheduledAt = null;
                                      _isLooping = false;
                                    });
                                  },
                                )
                              : Icon(Iconsax.arrow_right_3, color: AppColors.grey400),
                          onTap: () => _selectDateTime(context),
                        ),

                        // Loop/Repeat Options (only show when scheduled)
                        if (_scheduledAt != null) ...[
                          const Divider(height: 24),
                          SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: _isLooping
                                        ? AppColors.secondary.withOpacity(0.1)
                                        : AppColors.grey100,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    Iconsax.repeat,
                                    size: 20,
                                    color: _isLooping
                                        ? AppColors.secondary
                                        : AppColors.grey500,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  'Repeat Post',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(left: 44),
                              child: Text(
                                _isLooping
                                    ? 'Post will repeat automatically'
                                    : 'Enable to post multiple times',
                              ),
                            ),
                            value: _isLooping,
                            onChanged: (value) {
                              setState(() => _isLooping = value);
                            },
                            activeColor: AppColors.secondary,
                          ),

                          // Loop Settings (only show when looping is enabled)
                          if (_isLooping) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.secondary.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: AppColors.secondary.withOpacity(0.2),
                                ),
                              ),
                              child: Column(
                                children: [
                                  // Frequency
                                  Row(
                                    children: [
                                      Icon(
                                        Iconsax.calendar,
                                        size: 20,
                                        color: AppColors.secondary,
                                      ),
                                      const SizedBox(width: 12),
                                      const Text('Frequency:'),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: SegmentedButton<String>(
                                          segments: const [
                                            ButtonSegment(
                                              value: 'daily',
                                              label: Text('Daily'),
                                            ),
                                            ButtonSegment(
                                              value: 'weekly',
                                              label: Text('Weekly'),
                                            ),
                                            ButtonSegment(
                                              value: 'monthly',
                                              label: Text('Monthly'),
                                            ),
                                          ],
                                          selected: {_loopFrequency},
                                          onSelectionChanged: (value) {
                                            setState(() {
                                              _loopFrequency = value.first;
                                            });
                                          },
                                          style: ButtonStyle(
                                            visualDensity: VisualDensity.compact,
                                            textStyle: WidgetStateProperty.all(
                                              const TextStyle(fontSize: 12),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  // Repeat Count
                                  Row(
                                    children: [
                                      Icon(
                                        Iconsax.hashtag,
                                        size: 20,
                                        color: AppColors.secondary,
                                      ),
                                      const SizedBox(width: 12),
                                      const Text('Repeat:'),
                                      const SizedBox(width: 12),
                                      Container(
                                        decoration: BoxDecoration(
                                          border: Border.all(color: AppColors.grey300),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(
                                              icon: const Icon(Iconsax.minus),
                                              iconSize: 18,
                                              onPressed: _loopCount > 1
                                                  ? () => setState(() => _loopCount--)
                                                  : null,
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 16),
                                              child: Text(
                                                '$_loopCount',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 16,
                                                ),
                                              ),
                                            ),
                                            IconButton(
                                              icon: const Icon(Iconsax.add),
                                              iconSize: 18,
                                              onPressed: _loopCount < 30
                                                  ? () => setState(() => _loopCount++)
                                                  : null,
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'times',
                                        style: TextStyle(color: AppColors.grey600),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  // End Date
                                  InkWell(
                                    onTap: () => _selectLoopEndDate(context),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Iconsax.calendar_tick,
                                          size: 20,
                                          color: AppColors.secondary,
                                        ),
                                        const SizedBox(width: 12),
                                        const Text('End date:'),
                                        const SizedBox(width: 12),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: AppColors.grey300),
                                          ),
                                          child: Text(
                                            _loopEndDate != null
                                                ? DateFormat('MMM d, yyyy').format(_loopEndDate!)
                                                : 'No end date',
                                            style: TextStyle(
                                              color: _loopEndDate != null
                                                  ? AppColors.grey700
                                                  : AppColors.grey500,
                                            ),
                                          ),
                                        ),
                                        if (_loopEndDate != null) ...[
                                          const SizedBox(width: 8),
                                          InkWell(
                                            onTap: () => setState(() => _loopEndDate = null),
                                            child: Icon(
                                              Iconsax.close_circle,
                                              size: 18,
                                              color: AppColors.error,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  // Summary
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.info.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Iconsax.info_circle,
                                          size: 16,
                                          color: AppColors.info,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _getLoopSummary(),
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.info,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ],
                    ),
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
                              : Text(_getPublishButtonText()),
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

  Future<void> _selectLoopEndDate(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: _scheduledAt?.add(const Duration(days: 30)) ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: _scheduledAt ?? DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (date != null) {
      setState(() {
        _loopEndDate = date;
      });
    }
  }

  String _getLoopSummary() {
    if (_scheduledAt == null) return '';

    final frequencyText = {
      'daily': 'every day',
      'weekly': 'every week',
      'monthly': 'every month',
    }[_loopFrequency] ?? 'every day';

    final startText = DateFormat('MMM d').format(_scheduledAt!);
    final countText = '$_loopCount times';
    final endText = _loopEndDate != null
        ? ' until ${DateFormat('MMM d').format(_loopEndDate!)}'
        : '';

    return 'Starting $startText, posting $frequencyText for $countText$endText.';
  }

  String _getPublishButtonText() {
    if (widget.isEditing) {
      if (_scheduledAt == null) {
        return 'Update & Publish';
      }
      return 'Update Post';
    }
    if (_scheduledAt == null) {
      return 'Publish Now';
    }
    if (_isLooping) {
      return 'Schedule $_loopCount Posts';
    }
    return 'Schedule Post';
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
                    color: AppColors.info.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Iconsax.gallery, color: AppColors.info),
                ),
                title: const Text('Choose Images'),
                subtitle: const Text('Select photos from your device'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImages();
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
                title: const Text('Choose Videos'),
                subtitle: const Text('Select videos from your device'),
                onTap: () {
                  Navigator.pop(context);
                  _pickVideos();
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Iconsax.document, color: AppColors.secondary),
                ),
                title: const Text('Choose Any File'),
                subtitle: const Text('Select any media file'),
                onTap: () {
                  Navigator.pop(context);
                  _pickAnyMedia();
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickImages() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: true,
      );

      if (result != null && result.files.isNotEmpty) {
        _addPickedFiles(result.files, 'image');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking images: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _pickVideos() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.video,
        allowMultiple: true,
      );

      if (result != null && result.files.isNotEmpty) {
        _addPickedFiles(result.files, 'video');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking videos: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _pickAnyMedia() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'],
        allowMultiple: true,
      );

      if (result != null && result.files.isNotEmpty) {
        for (final file in result.files) {
          final ext = file.extension?.toLowerCase() ?? '';
          final type = ['mp4', 'mov', 'avi', 'webm'].contains(ext) ? 'video' : 'image';
          _addPickedFiles([file], type);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking files: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _addPickedFiles(List<PlatformFile> files, String type) {
    if (_selectedMedia.length >= 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 10 media items allowed')),
      );
      return;
    }

    final remainingSlots = 10 - _selectedMedia.length;
    final filesToAdd = files.take(remainingSlots).toList();

    setState(() {
      for (final file in filesToAdd) {
        _selectedMedia.add({
          'id': DateTime.now().millisecondsSinceEpoch.toString(),
          'type': type,
          'name': file.name,
          'path': file.path,
          'size': file.size,
          'bytes': file.bytes,
        });
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${filesToAdd.length} ${type == 'image' ? 'image(s)' : 'video(s)'} added'),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 2),
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

    if (widget.isEditing) {
      // Update existing post
      context.read<PostsBloc>().add(
            UpdatePost(
              widget.postId!,
              {
                'content': _contentController.text,
                'scheduledAt': _scheduledAt?.toIso8601String(),
                'status': _scheduledAt != null ? 'scheduled' : 'published',
              },
            ),
          );
    } else {
      // Create new post
      context.read<PostsBloc>().add(
            CreatePost(
              content: _contentController.text,
              platforms: _selectedPlatforms.toList(),
              scheduledAt: _scheduledAt,
            ),
          );
    }
  }
}
