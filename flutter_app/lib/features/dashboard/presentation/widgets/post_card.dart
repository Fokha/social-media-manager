import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';

class PostCard extends StatelessWidget {
  final Map<String, dynamic> post;

  const PostCard({super.key, required this.post});

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'published':
        return AppColors.success;
      case 'scheduled':
        return AppColors.info;
      case 'draft':
        return AppColors.grey500;
      case 'failed':
        return AppColors.error;
      default:
        return AppColors.grey400;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'published':
        return Iconsax.tick_circle;
      case 'scheduled':
        return Iconsax.clock;
      case 'draft':
        return Iconsax.document;
      case 'failed':
        return Iconsax.close_circle;
      default:
        return Iconsax.document;
    }
  }

  @override
  Widget build(BuildContext context) {
    final content = post['content'] ?? '';
    final status = post['status'] ?? 'draft';
    final platforms = List<String>.from(post['platforms'] ?? []);
    final scheduledAt = post['scheduledAt'];
    final publishedAt = post['publishedAt'];
    final mediaUrls = List<String>.from(post['mediaUrls'] ?? []);

    String formattedDate = '';
    if (scheduledAt != null) {
      final date = DateTime.parse(scheduledAt);
      formattedDate = DateFormat('MMM d, yyyy h:mm a').format(date);
    } else if (publishedAt != null) {
      final date = DateTime.parse(publishedAt);
      formattedDate = DateFormat('MMM d, yyyy h:mm a').format(date);
    }

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
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Row(
            children: [
              // Platform Icons
              Expanded(
                child: Wrap(
                  spacing: 6,
                  children: platforms.map((platform) {
                    return _PlatformChip(platform: platform);
                  }).toList(),
                ),
              ),
              // Status Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getStatusIcon(status),
                      size: 12,
                      color: _getStatusColor(status),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      status.toString().toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(status),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Content Preview
          Text(
            content,
            style: TextStyle(
              fontSize: 13,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),

          // Media Preview
          if (mediaUrls.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 50,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: mediaUrls.length > 3 ? 3 : mediaUrls.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) {
                  if (index == 2 && mediaUrls.length > 3) {
                    return Container(
                      width: 50,
                      decoration: BoxDecoration(
                        color: AppColors.grey200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          '+${mediaUrls.length - 2}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.grey600,
                          ),
                        ),
                      ),
                    );
                  }
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      mediaUrls[index],
                      width: 50,
                      height: 50,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 50,
                        height: 50,
                        color: AppColors.grey200,
                        child: Icon(
                          Iconsax.image,
                          color: AppColors.grey400,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],

          // Footer
          if (formattedDate.isNotEmpty) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(
                  status == 'scheduled' ? Iconsax.clock : Iconsax.calendar,
                  size: 14,
                  color: AppColors.grey500,
                ),
                const SizedBox(width: 6),
                Text(
                  formattedDate,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.grey500,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _PlatformChip extends StatelessWidget {
  final String platform;

  const _PlatformChip({required this.platform});

  IconData _getIcon() {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return Iconsax.instagram;
      case 'twitter':
      case 'x':
        return Iconsax.message;
      case 'linkedin':
        return Iconsax.link;
      case 'youtube':
        return Iconsax.video;
      default:
        return Iconsax.global;
    }
  }

  Color _getColor() {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return AppColors.instagram;
      case 'twitter':
      case 'x':
        return AppColors.twitter;
      case 'linkedin':
        return AppColors.linkedin;
      case 'youtube':
        return AppColors.youtube;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: _getColor().withOpacity(0.1),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Icon(
        _getIcon(),
        size: 14,
        color: _getColor(),
      ),
    );
  }
}
