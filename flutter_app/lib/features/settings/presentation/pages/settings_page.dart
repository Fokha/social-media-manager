import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../core/theme/app_colors.dart';
import '../bloc/settings_cubit.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: BlocBuilder<SettingsCubit, SettingsState>(
        builder: (context, state) {
          final cubit = context.read<SettingsCubit>();
          final isDarkMode = state.themeMode == ThemeMode.dark;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Appearance Section
                _buildSectionHeader(context, 'Appearance'),
                const SizedBox(height: 12),
                _buildSettingsCard(context, [
                  _buildSwitchTile(
                    context,
                    icon: Iconsax.moon,
                    iconColor: AppColors.primary,
                    title: 'Dark Mode',
                    subtitle: 'Use dark theme throughout the app',
                    value: isDarkMode,
                    onChanged: (value) => cubit.toggleDarkMode(value),
                  ),
                  _buildDivider(),
                  _buildDropdownTile(
                    context,
                    icon: Iconsax.language_square,
                    iconColor: AppColors.info,
                    title: 'Language',
                    value: state.language,
                    options: ['English', 'Spanish', 'French', 'German', 'Arabic'],
                    onChanged: (value) => cubit.setLanguage(value!),
                  ),
                  _buildDivider(),
                  _buildDropdownTile(
                    context,
                    icon: Iconsax.clock,
                    iconColor: AppColors.warning,
                    title: 'Timezone',
                    value: state.timezone,
                    options: [
                      'UTC-8 (PST)',
                      'UTC-5 (EST)',
                      'UTC+0 (GMT)',
                      'UTC+1 (CET)',
                      'UTC+3 (AST)',
                    ],
                    onChanged: (value) => cubit.setTimezone(value!),
                  ),
                ]),
                const SizedBox(height: 24),

                // Notifications Section
                _buildSectionHeader(context, 'Notifications'),
                const SizedBox(height: 12),
                _buildSettingsCard(context, [
                  _buildSwitchTile(
                    context,
                    icon: Iconsax.notification,
                    iconColor: AppColors.accent,
                    title: 'All Notifications',
                    subtitle: 'Enable or disable all notifications',
                    value: state.notifications,
                    onChanged: (value) => cubit.setNotifications(value),
                  ),
                  _buildDivider(),
                  _buildSwitchTile(
                    context,
                    icon: Iconsax.sms,
                    iconColor: AppColors.secondary,
                    title: 'Email Notifications',
                    subtitle: 'Receive updates via email',
                    value: state.emailNotifications,
                    onChanged: state.notifications
                        ? (value) => cubit.setEmailNotifications(value)
                        : null,
                  ),
                  _buildDivider(),
                  _buildSwitchTile(
                    context,
                    icon: Iconsax.mobile,
                    iconColor: AppColors.success,
                    title: 'Push Notifications',
                    subtitle: 'Receive push notifications on device',
                    value: state.pushNotifications,
                    onChanged: state.notifications
                        ? (value) => cubit.setPushNotifications(value)
                        : null,
                  ),
                ]),
                const SizedBox(height: 24),

                // Account Section
                _buildSectionHeader(context, 'Account'),
                const SizedBox(height: 12),
                _buildSettingsCard(context, [
                  _buildActionTile(
                    context,
                    icon: Iconsax.user_edit,
                    iconColor: AppColors.primary,
                    title: 'Edit Profile',
                    subtitle: 'Update your personal information',
                    onTap: () => _showEditProfileDialog(context),
                  ),
                  _buildDivider(),
                  _buildActionTile(
                    context,
                    icon: Iconsax.lock,
                    iconColor: AppColors.warning,
                    title: 'Change Password',
                    subtitle: 'Update your security credentials',
                    onTap: () => _showChangePasswordDialog(context),
                  ),
                  _buildDivider(),
                  _buildActionTile(
                    context,
                    icon: Iconsax.shield_tick,
                    iconColor: AppColors.success,
                    title: 'Two-Factor Authentication',
                    subtitle: 'Add extra security to your account',
                    onTap: () => _showTwoFactorDialog(context),
                  ),
                ]),
                const SizedBox(height: 24),

                // Connected Apps Section
                _buildSectionHeader(context, 'Connected Apps'),
                const SizedBox(height: 12),
                _buildSettingsCard(context, [
                  _buildActionTile(
                    context,
                    icon: Iconsax.link,
                    iconColor: AppColors.info,
                    title: 'Manage Connections',
                    subtitle: 'View and manage connected social accounts',
                    onTap: () => _showSnackbar(context, 'Opening connected accounts...'),
                  ),
                  _buildDivider(),
                  _buildActionTile(
                    context,
                    icon: Iconsax.key,
                    iconColor: AppColors.warning,
                    title: 'API Keys',
                    subtitle: 'Manage your API access keys',
                    onTap: () => _showApiKeysDialog(context),
                  ),
                ]),
                const SizedBox(height: 24),

                // Data & Privacy Section
                _buildSectionHeader(context, 'Data & Privacy'),
                const SizedBox(height: 12),
                _buildSettingsCard(context, [
                  _buildActionTile(
                    context,
                    icon: Iconsax.document_download,
                    iconColor: AppColors.info,
                    title: 'Export Data',
                    subtitle: 'Download all your data',
                    onTap: () => _showExportDataDialog(context),
                  ),
                  _buildDivider(),
                  _buildActionTile(
                    context,
                    icon: Iconsax.document_text,
                    iconColor: AppColors.grey500,
                    title: 'Privacy Policy',
                    subtitle: 'Read our privacy policy',
                    onTap: () => _showSnackbar(context, 'Opening Privacy Policy...'),
                  ),
                  _buildDivider(),
                  _buildActionTile(
                    context,
                    icon: Iconsax.info_circle,
                    iconColor: AppColors.grey500,
                    title: 'Terms of Service',
                    subtitle: 'Read our terms of service',
                    onTap: () => _showSnackbar(context, 'Opening Terms of Service...'),
                  ),
                ]),
                const SizedBox(height: 24),

                // Reset Settings
                _buildSectionHeader(context, 'Reset'),
                const SizedBox(height: 12),
                _buildSettingsCard(context, [
                  _buildActionTile(
                    context,
                    icon: Iconsax.refresh,
                    iconColor: AppColors.warning,
                    title: 'Reset Settings',
                    subtitle: 'Reset all settings to default',
                    onTap: () => _showResetSettingsDialog(context, cubit),
                  ),
                ]),
                const SizedBox(height: 24),

                // Danger Zone
                _buildSectionHeader(context, 'Danger Zone'),
                const SizedBox(height: 12),
                _buildSettingsCard(context, [
                  _buildActionTile(
                    context,
                    icon: Iconsax.logout,
                    iconColor: AppColors.error,
                    title: 'Sign Out',
                    subtitle: 'Sign out of your account',
                    onTap: () => _showSignOutDialog(context),
                    isDestructive: true,
                  ),
                  _buildDivider(),
                  _buildActionTile(
                    context,
                    icon: Iconsax.trash,
                    iconColor: AppColors.error,
                    title: 'Delete Account',
                    subtitle: 'Permanently delete your account and data',
                    onTap: () => _showDeleteAccountDialog(context),
                    isDestructive: true,
                  ),
                ]),
                const SizedBox(height: 32),

                // App Info
                Center(
                  child: Column(
                    children: [
                      Text(
                        'Social Media Manager',
                        style: TextStyle(
                          color: AppColors.grey500,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Version 1.0.0',
                        style: TextStyle(
                          color: AppColors.grey400,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildSettingsCard(BuildContext context, List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(height: 1, color: AppColors.grey200);
  }

  Widget _buildSwitchTile(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool>? onChanged,
  }) {
    final isDisabled = onChanged == null;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(isDisabled ? 0.05 : 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: isDisabled ? iconColor.withOpacity(0.5) : iconColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                    color: isDisabled ? AppColors.grey400 : null,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: isDisabled ? AppColors.grey300 : AppColors.grey500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownTile(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String value,
    required List<String> options,
    required ValueChanged<String?> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ),
          DropdownButton<String>(
            value: value,
            underline: const SizedBox(),
            items: options.map((option) {
              return DropdownMenuItem(
                value: option,
                child: Text(
                  option,
                  style: TextStyle(
                    color: AppColors.grey600,
                    fontSize: 13,
                  ),
                ),
              );
            }).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                      color: isDestructive ? AppColors.error : null,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: AppColors.grey500,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Iconsax.arrow_right_3,
              color: AppColors.grey400,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  void _showSnackbar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showEditProfileDialog(BuildContext context) {
    final nameController = TextEditingController(text: 'Demo User');
    final emailController = TextEditingController(text: 'user@socialmanager.com');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Name',
                prefixIcon: Icon(Iconsax.user),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                prefixIcon: Icon(Iconsax.sms),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackbar(context, 'Profile updated successfully!');
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Current Password',
                prefixIcon: Icon(Iconsax.lock),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'New Password',
                prefixIcon: Icon(Iconsax.lock_1),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Confirm New Password',
                prefixIcon: Icon(Iconsax.lock_1),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackbar(context, 'Password changed successfully!');
            },
            child: const Text('Change Password'),
          ),
        ],
      ),
    );
  }

  void _showTwoFactorDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Two-Factor Authentication'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Iconsax.shield_tick, color: AppColors.success),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      '2FA adds an extra layer of security to your account',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Scan this QR code with your authenticator app:',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 16),
            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Icon(Iconsax.scan_barcode, size: 80, color: Colors.black54),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackbar(context, '2FA enabled successfully!');
            },
            child: const Text('Enable 2FA'),
          ),
        ],
      ),
    );
  }

  void _showApiKeysDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('API Keys'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.grey100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'sk_live_••••••••••••••••',
                      style: TextStyle(fontFamily: 'monospace', fontSize: 13),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Iconsax.copy, size: 18),
                    onPressed: () {
                      _showSnackbar(context, 'API key copied to clipboard');
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  _showSnackbar(context, 'New API key generated');
                },
                icon: const Icon(Iconsax.refresh),
                label: const Text('Generate New Key'),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showExportDataDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Export Data'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Select what data you want to export:'),
            const SizedBox(height: 16),
            CheckboxListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('Posts'),
              dense: true,
            ),
            CheckboxListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('Messages'),
              dense: true,
            ),
            CheckboxListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('Analytics'),
              dense: true,
            ),
            CheckboxListTile(
              value: false,
              onChanged: (_) {},
              title: const Text('Account Settings'),
              dense: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              _showSnackbar(context, 'Data export started. You will receive an email when ready.');
            },
            icon: const Icon(Iconsax.document_download),
            label: const Text('Export'),
          ),
        ],
      ),
    );
  }

  void _showResetSettingsDialog(BuildContext context, SettingsCubit cubit) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Settings'),
        content: const Text('Are you sure you want to reset all settings to their default values?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              cubit.resetSettings();
              Navigator.pop(context);
              _showSnackbar(context, 'Settings reset to defaults');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.warning,
            ),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
  }

  void _showSignOutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackbar(context, 'Signed out successfully');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Iconsax.warning_2, color: AppColors.error),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'This action cannot be undone!',
                      style: TextStyle(fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'All your data will be permanently deleted including:\n'
              '• All posts and drafts\n'
              '• Connected social accounts\n'
              '• Messages and conversations\n'
              '• Analytics and insights',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              decoration: const InputDecoration(
                labelText: 'Type "DELETE" to confirm',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackbar(context, 'Account deletion requested');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
  }
}
