import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../core/theme/app_colors.dart';

class MainShell extends StatefulWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;
  bool _isAdminMode = false;

  final _userNavItems = [
    _NavItem(icon: Iconsax.home, label: 'Dashboard', path: '/dashboard'),
    _NavItem(icon: Iconsax.user_octagon, label: 'Accounts', path: '/accounts'),
    _NavItem(icon: Iconsax.document_text, label: 'Posts', path: '/posts'),
    _NavItem(icon: Iconsax.message, label: 'Messages', path: '/messages'),
    _NavItem(icon: Iconsax.wallet, label: 'Plans', path: '/subscription'),
    _NavItem(icon: Iconsax.setting_2, label: 'Settings', path: '/settings'),
  ];

  final _adminNavItems = [
    _NavItem(icon: Iconsax.home, label: 'Dashboard', path: '/admin'),
    _NavItem(icon: Iconsax.people, label: 'Users', path: '/admin/users'),
    _NavItem(icon: Iconsax.code, label: 'APIs', path: '/admin/api'),
    _NavItem(icon: Iconsax.receipt, label: 'Billing', path: '/admin/billing'),
    _NavItem(icon: Iconsax.setting_2, label: 'Settings', path: '/settings'),
  ];

  void _onNavTap(int index, List<_NavItem> items) {
    setState(() => _selectedIndex = index);
    context.go(items[index].path);
  }

  void _toggleAdminMode(bool value) {
    setState(() {
      _isAdminMode = value;
      _selectedIndex = 0;
    });
    // Navigate to the first item of the new mode
    if (value) {
      context.go('/admin');
    } else {
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final navItems = _isAdminMode ? _adminNavItems : _userNavItems;
    final isWideScreen = MediaQuery.of(context).size.width > 800;

    if (isWideScreen) {
      return _DesktopLayout(
        isAdminMode: _isAdminMode,
        onToggleAdmin: _toggleAdminMode,
        navItems: navItems,
        selectedIndex: _selectedIndex,
        onNavTap: (index) => _onNavTap(index, navItems),
        child: widget.child,
      );
    }

    return _MobileLayout(
      isAdminMode: _isAdminMode,
      onToggleAdmin: _toggleAdminMode,
      navItems: navItems,
      selectedIndex: _selectedIndex,
      onNavTap: (index) => _onNavTap(index, navItems),
      child: widget.child,
    );
  }
}

class _MobileLayout extends StatelessWidget {
  final bool isAdminMode;
  final Function(bool) onToggleAdmin;
  final List<_NavItem> navItems;
  final int selectedIndex;
  final Function(int) onNavTap;
  final Widget child;

  const _MobileLayout({
    required this.isAdminMode,
    required this.onToggleAdmin,
    required this.navItems,
    required this.selectedIndex,
    required this.onNavTap,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text(
                  'SM',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Text('Social Manager'),
          ],
        ),
        actions: [
          // Admin/User Toggle
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'User',
                  style: TextStyle(
                    fontSize: 12,
                    color: !isAdminMode ? AppColors.primary : AppColors.grey500,
                    fontWeight: !isAdminMode ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
                Switch(
                  value: isAdminMode,
                  onChanged: onToggleAdmin,
                  activeColor: AppColors.warning,
                ),
                Text(
                  'Admin',
                  style: TextStyle(
                    fontSize: 12,
                    color: isAdminMode ? AppColors.warning : AppColors.grey500,
                    fontWeight: isAdminMode ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: navItems.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                final isSelected = selectedIndex == index;

                return GestureDetector(
                  onTap: () => onNavTap(index),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: EdgeInsets.symmetric(
                      horizontal: isSelected ? 16 : 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? (isAdminMode ? AppColors.warning : AppColors.primary)
                              .withOpacity(0.1)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          item.icon,
                          color: isSelected
                              ? (isAdminMode ? AppColors.warning : AppColors.primary)
                              : AppColors.grey400,
                          size: 22,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.label,
                          style: TextStyle(
                            color: isSelected
                                ? (isAdminMode ? AppColors.warning : AppColors.primary)
                                : AppColors.grey500,
                            fontSize: 10,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}

class _DesktopLayout extends StatelessWidget {
  final bool isAdminMode;
  final Function(bool) onToggleAdmin;
  final List<_NavItem> navItems;
  final int selectedIndex;
  final Function(int) onNavTap;
  final Widget child;

  const _DesktopLayout({
    required this.isAdminMode,
    required this.onToggleAdmin,
    required this.navItems,
    required this.selectedIndex,
    required this.onNavTap,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final accentColor = isAdminMode ? AppColors.warning : AppColors.primary;

    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          Container(
            width: 240,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border(
                right: BorderSide(color: AppColors.grey200),
              ),
            ),
            child: Column(
              children: [
                // Logo
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(
                          child: Text(
                            'SM',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Social Manager',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),

                // Role Toggle Switch
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: accentColor.withOpacity(0.3),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isAdminMode ? Iconsax.shield_tick : Iconsax.user,
                            size: 18,
                            color: accentColor,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isAdminMode ? 'Admin Mode' : 'User Mode',
                            style: TextStyle(
                              color: accentColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'User',
                            style: TextStyle(
                              fontSize: 11,
                              color: !isAdminMode ? AppColors.primary : AppColors.grey500,
                              fontWeight: !isAdminMode ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                          Switch(
                            value: isAdminMode,
                            onChanged: onToggleAdmin,
                            activeColor: AppColors.warning,
                          ),
                          Text(
                            'Admin',
                            style: TextStyle(
                              fontSize: 11,
                              color: isAdminMode ? AppColors.warning : AppColors.grey500,
                              fontWeight: isAdminMode ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Navigation Items
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: navItems.length,
                    itemBuilder: (context, index) {
                      final item = navItems[index];
                      final isSelected = selectedIndex == index;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: ListTile(
                          onTap: () => onNavTap(index),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          selected: isSelected,
                          selectedTileColor: accentColor.withOpacity(0.1),
                          leading: Icon(
                            item.icon,
                            color: isSelected ? accentColor : AppColors.grey500,
                          ),
                          title: Text(
                            item.label,
                            style: TextStyle(
                              color: isSelected ? accentColor : AppColors.grey700,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // Demo User Info
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(color: AppColors.grey200),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: accentColor,
                        child: Text(
                          isAdminMode ? 'A' : 'U',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              isAdminMode ? 'Admin User' : 'Demo User',
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                                fontSize: 13,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              isAdminMode
                                  ? 'admin@socialmanager.com'
                                  : 'user@socialmanager.com',
                              style: TextStyle(
                                color: AppColors.grey500,
                                fontSize: 11,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Main Content
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String path;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.path,
  });
}
