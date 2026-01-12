import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../bloc/admin_bloc.dart';

class AdminUsersPage extends StatelessWidget {
  const AdminUsersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<AdminBloc>()..add(const LoadUsers()),
      child: const _AdminUsersView(),
    );
  }
}

class _AdminUsersView extends StatefulWidget {
  const _AdminUsersView();

  @override
  State<_AdminUsersView> createState() => _AdminUsersViewState();
}

class _AdminUsersViewState extends State<_AdminUsersView> {
  final _searchController = TextEditingController();
  String _filterRole = 'all';
  String _filterStatus = 'all';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.refresh),
            onPressed: () {
              context.read<AdminBloc>().add(const LoadUsers());
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
          return Column(
            children: [
              // Search and Filters
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  border: Border(bottom: BorderSide(color: AppColors.grey200)),
                ),
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search users...',
                        prefixIcon: const Icon(Iconsax.search_normal),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildFilterDropdown(
                            'Role',
                            _filterRole,
                            ['all', 'user', 'admin', 'superAdmin'],
                            (value) => setState(() => _filterRole = value!),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildFilterDropdown(
                            'Status',
                            _filterStatus,
                            ['all', 'active', 'inactive'],
                            (value) => setState(() => _filterStatus = value!),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Users List
              Expanded(
                child: state.isLoading && state.users.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : _buildUsersList(context, state),
              ),

              // Pagination
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  border: Border(top: BorderSide(color: AppColors.grey200)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total: ${state.totalUsers} users',
                      style: TextStyle(color: AppColors.grey500),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: Icon(
                            Iconsax.arrow_left_2,
                            color: state.currentPage > 1
                                ? AppColors.primary
                                : AppColors.grey300,
                          ),
                          onPressed: state.currentPage > 1
                              ? () {
                                  context.read<AdminBloc>().add(
                                        LoadUsers(
                                          page: state.currentPage - 1,
                                          limit: state.usersPerPage,
                                        ),
                                      );
                                }
                              : null,
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Page ${state.currentPage} of ${state.totalPages}',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            Iconsax.arrow_right_3,
                            color: state.currentPage < state.totalPages
                                ? AppColors.primary
                                : AppColors.grey300,
                          ),
                          onPressed: state.currentPage < state.totalPages
                              ? () {
                                  context.read<AdminBloc>().add(
                                        LoadUsers(
                                          page: state.currentPage + 1,
                                          limit: state.usersPerPage,
                                        ),
                                      );
                                }
                              : null,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterDropdown(
    String label,
    String value,
    List<String> options,
    Function(String?) onChanged,
  ) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      items: options.map((option) {
        return DropdownMenuItem(
          value: option,
          child: Text(option[0].toUpperCase() + option.substring(1)),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildUsersList(BuildContext context, AdminState state) {
    var filteredUsers = state.users;

    // Apply search filter
    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      filteredUsers = filteredUsers.where((user) {
        final email = (user['email'] ?? '').toLowerCase();
        final name =
            '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.toLowerCase();
        return email.contains(query) || name.contains(query);
      }).toList();
    }

    // Apply role filter
    if (_filterRole != 'all') {
      filteredUsers = filteredUsers
          .where((user) => user['role'] == _filterRole)
          .toList();
    }

    // Apply status filter
    if (_filterStatus != 'all') {
      final isActive = _filterStatus == 'active';
      filteredUsers = filteredUsers
          .where((user) => user['isActive'] == isActive)
          .toList();
    }

    if (filteredUsers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Iconsax.people, size: 64, color: AppColors.grey300),
            const SizedBox(height: 16),
            Text(
              'No users found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: filteredUsers.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final user = filteredUsers[index];
        return _UserCard(
          user: user,
          onRoleChange: (role) {
            context.read<AdminBloc>().add(
                  UpdateUserRole(user['id'], role),
                );
          },
          onStatusToggle: () {
            context.read<AdminBloc>().add(
                  UpdateUserStatus(user['id'], !(user['isActive'] ?? true)),
                );
          },
        );
      },
    );
  }
}

class _UserCard extends StatelessWidget {
  final Map<String, dynamic> user;
  final Function(String) onRoleChange;
  final VoidCallback onStatusToggle;

  const _UserCard({
    required this.user,
    required this.onRoleChange,
    required this.onStatusToggle,
  });

  @override
  Widget build(BuildContext context) {
    final email = user['email'] ?? '';
    final firstName = user['firstName'] ?? '';
    final lastName = user['lastName'] ?? '';
    final fullName = '$firstName $lastName'.trim();
    final role = user['role'] ?? 'user';
    final isActive = user['isActive'] ?? true;
    final createdAt = user['createdAt'];
    final plan = user['subscription']?['plan'] ?? 'free';

    String formattedDate = '';
    if (createdAt != null) {
      final date = DateTime.parse(createdAt);
      formattedDate = DateFormat('MMM d, yyyy').format(date);
    }

    return Container(
      padding: const EdgeInsets.all(16),
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
          // Avatar
          CircleAvatar(
            radius: 24,
            backgroundColor: _getRoleColor(role).withOpacity(0.1),
            child: Text(
              fullName.isNotEmpty ? fullName[0].toUpperCase() : email[0].toUpperCase(),
              style: TextStyle(
                color: _getRoleColor(role),
                fontWeight: FontWeight.w600,
                fontSize: 18,
              ),
            ),
          ),
          const SizedBox(width: 16),

          // User Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        fullName.isNotEmpty ? fullName : email,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _RoleBadge(role: role),
                    const SizedBox(width: 8),
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
                const SizedBox(height: 4),
                Text(
                  email,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.grey500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _InfoChip(
                      icon: Iconsax.wallet,
                      label: plan.toString().toUpperCase(),
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    _InfoChip(
                      icon: Iconsax.calendar,
                      label: formattedDate,
                      color: AppColors.grey500,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          PopupMenuButton<String>(
            icon: Icon(Iconsax.more, color: AppColors.grey500),
            onSelected: (value) {
              switch (value) {
                case 'toggle_status':
                  onStatusToggle();
                  break;
                case 'make_admin':
                  onRoleChange('admin');
                  break;
                case 'make_user':
                  onRoleChange('user');
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'toggle_status',
                child: Row(
                  children: [
                    Icon(
                      isActive ? Iconsax.user_remove : Iconsax.user_tick,
                      size: 18,
                      color: isActive ? AppColors.error : AppColors.success,
                    ),
                    const SizedBox(width: 12),
                    Text(isActive ? 'Deactivate' : 'Activate'),
                  ],
                ),
              ),
              if (role != 'admin')
                PopupMenuItem(
                  value: 'make_admin',
                  child: Row(
                    children: [
                      Icon(
                        Iconsax.shield_tick,
                        size: 18,
                        color: AppColors.warning,
                      ),
                      const SizedBox(width: 12),
                      const Text('Make Admin'),
                    ],
                  ),
                ),
              if (role == 'admin')
                PopupMenuItem(
                  value: 'make_user',
                  child: Row(
                    children: [
                      Icon(
                        Iconsax.user,
                        size: 18,
                        color: AppColors.grey600,
                      ),
                      const SizedBox(width: 12),
                      const Text('Remove Admin'),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getRoleColor(String role) {
    switch (role) {
      case 'superAdmin':
        return AppColors.error;
      case 'admin':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;

  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    switch (role) {
      case 'superAdmin':
        color = AppColors.error;
        label = 'SUPER ADMIN';
        break;
      case 'admin':
        color = AppColors.warning;
        label = 'ADMIN';
        break;
      default:
        color = AppColors.primary;
        label = 'USER';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _InfoChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: color,
          ),
        ),
      ],
    );
  }
}
