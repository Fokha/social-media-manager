import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../bloc/admin_bloc.dart';

class AdminApiPage extends StatelessWidget {
  const AdminApiPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<AdminBloc>()..add(LoadApiSettings()),
      child: const _AdminApiView(),
    );
  }
}

class _AdminApiView extends StatelessWidget {
  const _AdminApiView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('API Management'),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.refresh),
            onPressed: () {
              context.read<AdminBloc>().add(LoadApiSettings());
            },
          ),
        ],
      ),
      body: BlocConsumer<AdminBloc, AdminState>(
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
          if (state.isLoading && state.apiProviders.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // AI Providers Section
                Text(
                  'AI Providers',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'OpenAI',
                  description: 'GPT-4 and GPT-3.5 for content generation',
                  icon: Iconsax.cpu,
                  color: const Color(0xFF10A37F),
                  isConfigured: _isProviderConfigured(state, 'openai'),
                  onConfigure: () => _showApiKeyDialog(context, 'openai'),
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'Anthropic',
                  description: 'Claude AI for content generation',
                  icon: Iconsax.message_programming,
                  color: const Color(0xFFD97706),
                  isConfigured: _isProviderConfigured(state, 'anthropic'),
                  onConfigure: () => _showApiKeyDialog(context, 'anthropic'),
                ),
                const SizedBox(height: 24),

                // Social Media APIs Section
                Text(
                  'Social Media APIs',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'Instagram (Meta)',
                  description: 'Instagram Graph API for posts and messages',
                  icon: Iconsax.instagram,
                  color: AppColors.instagram,
                  isConfigured: _isProviderConfigured(state, 'instagram'),
                  onConfigure: () => _showApiKeyDialog(context, 'instagram'),
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'Twitter / X',
                  description: 'Twitter API v2 for tweets and DMs',
                  icon: Iconsax.message,
                  color: AppColors.twitter,
                  isConfigured: _isProviderConfigured(state, 'twitter'),
                  onConfigure: () => _showApiKeyDialog(context, 'twitter'),
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'LinkedIn',
                  description: 'LinkedIn Marketing API for posts',
                  icon: Iconsax.link,
                  color: AppColors.linkedin,
                  isConfigured: _isProviderConfigured(state, 'linkedin'),
                  onConfigure: () => _showApiKeyDialog(context, 'linkedin'),
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'YouTube',
                  description: 'YouTube Data API for video management',
                  icon: Iconsax.video,
                  color: AppColors.youtube,
                  isConfigured: _isProviderConfigured(state, 'youtube'),
                  onConfigure: () => _showApiKeyDialog(context, 'youtube'),
                ),
                const SizedBox(height: 24),

                // Messaging APIs Section
                Text(
                  'Messaging APIs',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'WhatsApp Business',
                  description: 'WhatsApp Business API for messaging',
                  icon: Iconsax.message_text,
                  color: AppColors.whatsapp,
                  isConfigured: _isProviderConfigured(state, 'whatsapp'),
                  onConfigure: () => _showApiKeyDialog(context, 'whatsapp'),
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'Telegram Bot',
                  description: 'Telegram Bot API for messaging',
                  icon: Iconsax.send_2,
                  color: AppColors.telegram,
                  isConfigured: _isProviderConfigured(state, 'telegram'),
                  onConfigure: () => _showApiKeyDialog(context, 'telegram'),
                ),
                const SizedBox(height: 24),

                // Payment APIs Section
                Text(
                  'Payment & Billing',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _ApiProviderCard(
                  name: 'Stripe',
                  description: 'Payment processing and subscriptions',
                  icon: Iconsax.card,
                  color: const Color(0xFF635BFF),
                  isConfigured: _isProviderConfigured(state, 'stripe'),
                  onConfigure: () => _showApiKeyDialog(context, 'stripe'),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  bool _isProviderConfigured(AdminState state, String provider) {
    return state.apiProviders.any(
      (p) => p['name'] == provider && p['isConfigured'] == true,
    );
  }

  void _showApiKeyDialog(BuildContext context, String provider) {
    final apiKeyController = TextEditingController();
    final apiSecretController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Configure ${provider.toUpperCase()} API'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: apiKeyController,
              decoration: const InputDecoration(
                labelText: 'API Key',
                hintText: 'Enter your API key',
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: apiSecretController,
              decoration: const InputDecoration(
                labelText: 'API Secret (if required)',
                hintText: 'Enter your API secret',
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.info.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Iconsax.info_circle,
                    color: AppColors.info,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'API keys are encrypted and stored securely.',
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
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (apiKeyController.text.isNotEmpty) {
                context.read<AdminBloc>().add(
                      UpdateApiKey(provider, apiKeyController.text),
                    );
                Navigator.of(dialogContext).pop();
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _ApiProviderCard extends StatelessWidget {
  final String name;
  final String description;
  final IconData icon;
  final Color color;
  final bool isConfigured;
  final VoidCallback onConfigure;

  const _ApiProviderCard({
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
    required this.isConfigured,
    required this.onConfigure,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isConfigured ? color.withOpacity(0.3) : AppColors.grey200,
        ),
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
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (isConfigured)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Iconsax.tick_circle,
                              size: 12,
                              color: AppColors.success,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'CONFIGURED',
                              style: TextStyle(
                                color: AppColors.success,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.grey500,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onConfigure,
            icon: Icon(
              isConfigured ? Iconsax.edit : Iconsax.add_circle,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
