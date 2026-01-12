import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../bloc/accounts_bloc.dart';
import '../widgets/platform_connect_card.dart';
import '../widgets/connected_account_tile.dart';

class AccountsPage extends StatelessWidget {
  const AccountsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<AccountsBloc>()..add(LoadAccounts()),
      child: const _AccountsView(),
    );
  }
}

class _AccountsView extends StatelessWidget {
  const _AccountsView();

  static const _platforms = [
    {'name': 'Instagram', 'key': 'instagram', 'icon': Iconsax.instagram},
    {'name': 'Twitter / X', 'key': 'twitter', 'icon': Iconsax.message},
    {'name': 'LinkedIn', 'key': 'linkedin', 'icon': Iconsax.link},
    {'name': 'YouTube', 'key': 'youtube', 'icon': Iconsax.video},
    {'name': 'WhatsApp', 'key': 'whatsapp', 'icon': Iconsax.message_text},
    {'name': 'Telegram', 'key': 'telegram', 'icon': Iconsax.send_2},
    {'name': 'GitHub', 'key': 'github', 'icon': Iconsax.code},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Accounts'),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.refresh),
            onPressed: () {
              context.read<AccountsBloc>().add(RefreshAccounts());
            },
          ),
        ],
      ),
      body: BlocConsumer<AccountsBloc, AccountsState>(
        listener: (context, state) {
          if (state.error != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.error!),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state.isLoading && state.accounts.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<AccountsBloc>().add(RefreshAccounts());
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Connected Accounts Section
                  if (state.accounts.isNotEmpty) ...[
                    Text(
                      'Connected Accounts',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: state.accounts.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final account = state.accounts[index];
                        return ConnectedAccountTile(
                          account: account,
                          onDisconnect: () {
                            _showDisconnectDialog(context, account);
                          },
                          onEdit: () {
                            _showEditDialog(context, account);
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 32),
                  ],

                  // Add New Account Section
                  Text(
                    'Connect New Account',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Connect your social media accounts to start managing them',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.grey500,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Platform Grid
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: MediaQuery.of(context).size.width > 600 ? 4 : 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.3,
                    ),
                    itemCount: _platforms.length,
                    itemBuilder: (context, index) {
                      final platform = _platforms[index];
                      final isConnected = state.accounts.any(
                        (a) => a['platform']?.toLowerCase() == platform['key'],
                      );
                      final isConnecting =
                          state.connectingPlatform == platform['key'];

                      return PlatformConnectCard(
                        name: platform['name'] as String,
                        platformKey: platform['key'] as String,
                        icon: platform['icon'] as IconData,
                        isConnected: isConnected,
                        isConnecting: isConnecting,
                        onConnect: () {
                          context.read<AccountsBloc>().add(
                                ConnectAccount(platform['key'] as String),
                              );
                        },
                      );
                    },
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showDisconnectDialog(
    BuildContext context,
    Map<String, dynamic> account,
  ) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Disconnect Account'),
        content: Text(
          'Are you sure you want to disconnect ${account['platform']} account @${account['username']}? This will remove all associated data.',
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
              context.read<AccountsBloc>().add(
                    DisconnectAccount(account['id']),
                  );
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Disconnect'),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(BuildContext context, Map<String, dynamic> account) {
    final nameController = TextEditingController(
      text: account['accountName'] ?? account['username'],
    );

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Edit Account'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Display Name',
                hintText: 'Enter a custom name',
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
              context.read<AccountsBloc>().add(
                    UpdateAccountSettings(
                      account['id'],
                      {'accountName': nameController.text},
                    ),
                  );
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
