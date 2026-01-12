import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax/iconsax.dart';
import 'package:url_launcher/url_launcher.dart';

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
                    onChanged: (value) {
                      cubit.toggleDarkMode(value);
                      _showSettingsFeedback(
                        context,
                        value ? 'Dark mode enabled' : 'Light mode enabled',
                        Iconsax.moon,
                      );
                    },
                  ),
                  _buildDivider(),
                  _buildDropdownTile(
                    context,
                    icon: Iconsax.language_square,
                    iconColor: AppColors.info,
                    title: 'Language',
                    value: state.language,
                    options: ['English', 'Spanish', 'French', 'German', 'Arabic'],
                    onChanged: (value) {
                      cubit.setLanguage(value!);
                      _showSettingsFeedback(
                        context,
                        'Language changed to $value',
                        Iconsax.language_square,
                      );
                    },
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
                    onChanged: (value) {
                      cubit.setTimezone(value!);
                      _showSettingsFeedback(
                        context,
                        'Timezone set to $value',
                        Iconsax.clock,
                      );
                    },
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
                    onChanged: (value) {
                      cubit.setNotifications(value);
                      _showSettingsFeedback(
                        context,
                        value ? 'Notifications enabled' : 'Notifications disabled',
                        Iconsax.notification,
                      );
                    },
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
                        ? (value) {
                            cubit.setEmailNotifications(value);
                            _showSettingsFeedback(
                              context,
                              value ? 'Email notifications enabled' : 'Email notifications disabled',
                              Iconsax.sms,
                            );
                          }
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
                        ? (value) {
                            cubit.setPushNotifications(value);
                            _showSettingsFeedback(
                              context,
                              value ? 'Push notifications enabled' : 'Push notifications disabled',
                              Iconsax.mobile,
                            );
                          }
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
                    onTap: () => context.go('/accounts'),
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
                    onTap: () => _showPrivacyPolicyDialog(context),
                  ),
                  _buildDivider(),
                  _buildActionTile(
                    context,
                    icon: Iconsax.info_circle,
                    iconColor: AppColors.grey500,
                    title: 'Terms of Service',
                    subtitle: 'Read our terms of service',
                    onTap: () => _showTermsOfServiceDialog(context),
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

  void _showSettingsFeedback(BuildContext context, String message, IconData icon) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
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
    String apiKey = 'sk_live_a1b2c3d4e5f6g7h8i9j0';
    bool showKey = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
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
                      Expanded(
                        child: Text(
                          showKey ? apiKey : 'sk_live_••••••••••••••••',
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                        ),
                      ),
                      IconButton(
                        icon: Icon(showKey ? Iconsax.eye_slash : Iconsax.eye, size: 18),
                        onPressed: () => setState(() => showKey = !showKey),
                      ),
                      IconButton(
                        icon: const Icon(Iconsax.copy, size: 18),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: apiKey));
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
                      setState(() {
                        apiKey = 'sk_live_${DateTime.now().millisecondsSinceEpoch}';
                        showKey = true;
                      });
                      _showSnackbar(context, 'New API key generated');
                    },
                    icon: const Icon(Iconsax.refresh),
                    label: const Text('Generate New Key'),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Keep your API key secure. Do not share it publicly.',
                  style: TextStyle(fontSize: 11, color: AppColors.grey500),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showExportDataDialog(BuildContext context) {
    bool exportPosts = true;
    bool exportMessages = true;
    bool exportAnalytics = true;
    bool exportSettings = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text('Export Data'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Select what data you want to export:'),
                const SizedBox(height: 16),
                CheckboxListTile(
                  value: exportPosts,
                  onChanged: (v) => setState(() => exportPosts = v ?? false),
                  title: const Text('Posts'),
                  subtitle: const Text('All your published and draft posts'),
                  dense: true,
                ),
                CheckboxListTile(
                  value: exportMessages,
                  onChanged: (v) => setState(() => exportMessages = v ?? false),
                  title: const Text('Messages'),
                  subtitle: const Text('Conversations and message history'),
                  dense: true,
                ),
                CheckboxListTile(
                  value: exportAnalytics,
                  onChanged: (v) => setState(() => exportAnalytics = v ?? false),
                  title: const Text('Analytics'),
                  subtitle: const Text('Performance data and insights'),
                  dense: true,
                ),
                CheckboxListTile(
                  value: exportSettings,
                  onChanged: (v) => setState(() => exportSettings = v ?? false),
                  title: const Text('Account Settings'),
                  subtitle: const Text('Preferences and configurations'),
                  dense: true,
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              ElevatedButton.icon(
                onPressed: (exportPosts || exportMessages || exportAnalytics || exportSettings)
                    ? () {
                        Navigator.pop(ctx);
                        final items = <String>[];
                        if (exportPosts) items.add('Posts');
                        if (exportMessages) items.add('Messages');
                        if (exportAnalytics) items.add('Analytics');
                        if (exportSettings) items.add('Settings');
                        _showSnackbar(
                          context,
                          'Exporting: ${items.join(", ")}. You will receive an email when ready.',
                        );
                      }
                    : null,
                icon: const Icon(Iconsax.document_download),
                label: const Text('Export'),
              ),
            ],
          );
        },
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

  void _showPrivacyPolicyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Iconsax.document_text, color: AppColors.primary),
            const SizedBox(width: 12),
            const Text('Privacy Policy'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Last updated: January 12, 2026', style: TextStyle(color: AppColors.grey500, fontSize: 12)),
                const SizedBox(height: 16),
                const Text('1. Information We Collect', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'We collect information you provide directly, including account details, social media connections, and content you create through our platform.',
                  style: TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                const Text('2. How We Use Your Information', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'Your information is used to provide and improve our services, manage your social media accounts, and personalize your experience.',
                  style: TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                const Text('3. Data Security', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'We implement industry-standard security measures to protect your data. OAuth tokens are encrypted and stored securely.',
                  style: TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                const Text('4. Your Rights', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'You can access, export, or delete your data at any time through the settings page.',
                  style: TextStyle(fontSize: 13),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              final url = Uri.parse('https://example.com/privacy');
              if (await canLaunchUrl(url)) {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              }
            },
            icon: const Icon(Iconsax.export_3, size: 16),
            label: const Text('Full Version'),
          ),
        ],
      ),
    );
  }

  void _showTermsOfServiceDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Iconsax.info_circle, color: AppColors.primary),
            const SizedBox(width: 12),
            const Text('Terms of Service'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Last updated: January 12, 2026', style: TextStyle(color: AppColors.grey500, fontSize: 12)),
                const SizedBox(height: 16),
                const Text('1. Acceptance of Terms', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'By using Social Media Manager, you agree to these terms. If you disagree with any part, please do not use our services.',
                  style: TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                const Text('2. Use of Service', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'You are responsible for maintaining the security of your account and all activities under your account.',
                  style: TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                const Text('3. Content Guidelines', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'You agree not to post content that is illegal, harmful, or violates third-party rights.',
                  style: TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                const Text('4. Service Modifications', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'We reserve the right to modify or discontinue the service at any time with reasonable notice.',
                  style: TextStyle(fontSize: 13),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              final url = Uri.parse('https://example.com/terms');
              if (await canLaunchUrl(url)) {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              }
            },
            icon: const Icon(Iconsax.export_3, size: 16),
            label: const Text('Full Version'),
          ),
        ],
      ),
    );
  }
}
