import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';

class ConnectedAccountTile extends StatelessWidget {
  final Map<String, dynamic> account;
  final VoidCallback onDisconnect;
  final VoidCallback onEdit;

  const ConnectedAccountTile({
    super.key,
    required this.account,
    required this.onDisconnect,
    required this.onEdit,
  });

  IconData _getPlatformIcon(String platform) {
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
      case 'whatsapp':
        return Iconsax.message_text;
      case 'telegram':
        return Iconsax.send_2;
      case 'github':
        return Iconsax.code;
      default:
        return Iconsax.global;
    }
  }

  Color _getPlatformColor(String platform) {
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
      case 'whatsapp':
        return AppColors.whatsapp;
      case 'telegram':
        return AppColors.telegram;
      case 'github':
        return AppColors.github;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final platform = account['platform'] ?? 'unknown';
    final username = account['username'] ?? 'Unknown';
    final displayName = account['accountName'] ?? username;
    final isActive = account['isActive'] ?? true;
    final connectedAt = account['createdAt'];

    String formattedDate = '';
    if (connectedAt != null) {
      final date = DateTime.parse(connectedAt);
      formattedDate = DateFormat('MMM d, yyyy').format(date);
    }

    final color = _getPlatformColor(platform);

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
      child: Row(
        children: [
          // Platform Icon
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _getPlatformIcon(platform),
              color: color,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),

          // Account Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        displayName,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isActive ? AppColors.success : AppColors.grey400,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '@$username',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.grey500,
                  ),
                ),
                if (formattedDate.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Connected $formattedDate',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.grey400,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Actions
          PopupMenuButton<String>(
            icon: Icon(Iconsax.more, color: AppColors.grey500, size: 20),
            onSelected: (value) {
              switch (value) {
                case 'edit':
                  onEdit();
                  break;
                case 'disconnect':
                  onDisconnect();
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Iconsax.edit, size: 18, color: AppColors.grey600),
                    const SizedBox(width: 12),
                    const Text('Edit'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'disconnect',
                child: Row(
                  children: [
                    Icon(Iconsax.trash, size: 18, color: AppColors.error),
                    const SizedBox(width: 12),
                    Text('Disconnect', style: TextStyle(color: AppColors.error)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
