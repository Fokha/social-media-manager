import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../core/theme/app_colors.dart';

class AccountCard extends StatelessWidget {
  final Map<String, dynamic> account;

  const AccountCard({super.key, required this.account});

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
    final username = account['username'] ?? account['accountName'] ?? 'Unknown';
    final isActive = account['isActive'] ?? true;

    return Container(
      width: 160,
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
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _getPlatformColor(platform).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _getPlatformIcon(platform),
                  color: _getPlatformColor(platform),
                  size: 20,
                ),
              ),
              const Spacer(),
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
          const SizedBox(height: 12),
          Text(
            platform.toString().toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: _getPlatformColor(platform),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '@$username',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
