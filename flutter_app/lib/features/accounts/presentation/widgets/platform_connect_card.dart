import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class PlatformConnectCard extends StatelessWidget {
  final String name;
  final String platformKey;
  final IconData icon;
  final bool isConnected;
  final bool isConnecting;
  final VoidCallback onConnect;

  const PlatformConnectCard({
    super.key,
    required this.name,
    required this.platformKey,
    required this.icon,
    required this.isConnected,
    required this.isConnecting,
    required this.onConnect,
  });

  Color _getPlatformColor() {
    switch (platformKey.toLowerCase()) {
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
    final color = _getPlatformColor();

    return GestureDetector(
      onTap: isConnected || isConnecting ? null : onConnect,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isConnected
              ? color.withOpacity(0.1)
              : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isConnected ? color : AppColors.grey200,
            width: isConnected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: isConnecting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              name,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            if (isConnected)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Connected',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w500,
                    color: AppColors.success,
                  ),
                ),
              )
            else
              Text(
                'Tap to connect',
                style: TextStyle(
                  fontSize: 9,
                  color: AppColors.grey400,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
