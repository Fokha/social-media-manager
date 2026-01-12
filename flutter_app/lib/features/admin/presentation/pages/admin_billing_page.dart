import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../bloc/admin_bloc.dart';

class AdminBillingPage extends StatelessWidget {
  const AdminBillingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<AdminBloc>()..add(LoadBillingData()),
      child: const _AdminBillingView(),
    );
  }
}

class _AdminBillingView extends StatelessWidget {
  const _AdminBillingView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Billing & Costs'),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.refresh),
            onPressed: () {
              context.read<AdminBloc>().add(LoadBillingData());
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
        },
        builder: (context, state) {
          if (state.isLoading && state.billingData.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          final billing = state.billingData;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Monthly Overview Card
                _buildMonthlyOverview(context, billing),
                const SizedBox(height: 24),

                // Revenue vs Costs
                Text(
                  'Revenue vs Costs',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _buildRevenueVsCosts(context, billing),
                const SizedBox(height: 24),

                // API Costs Breakdown
                Text(
                  'API Costs Breakdown',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _buildApiCostsBreakdown(context, billing),
                const SizedBox(height: 24),

                // Recent Transactions
                Text(
                  'Recent Transactions',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _buildRecentTransactions(context, billing),
                const SizedBox(height: 24),

                // Payment Methods
                Text(
                  'Payment Methods',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _buildPaymentMethods(context, billing),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMonthlyOverview(
    BuildContext context,
    Map<String, dynamic> billing,
  ) {
    final revenue = billing['monthlyRevenue'] ?? 0.0;
    final costs = billing['monthlyCosts'] ?? 0.0;
    final profit = revenue - costs;
    final profitMargin = revenue > 0 ? (profit / revenue * 100) : 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: profit >= 0
            ? AppColors.primaryGradient
            : LinearGradient(
                colors: [AppColors.error, AppColors.error.withOpacity(0.8)],
              ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: (profit >= 0 ? AppColors.primary : AppColors.error)
                .withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Net Profit This Month',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '\$${profit.toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${profitMargin.toStringAsFixed(1)}% margin',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _OverviewMetric(
                  label: 'Revenue',
                  value: '\$${revenue.toStringAsFixed(2)}',
                  icon: Iconsax.arrow_up_1,
                  isPositive: true,
                ),
              ),
              Container(
                width: 1,
                height: 40,
                color: Colors.white.withOpacity(0.2),
              ),
              Expanded(
                child: _OverviewMetric(
                  label: 'Costs',
                  value: '\$${costs.toStringAsFixed(2)}',
                  icon: Iconsax.arrow_down,
                  isPositive: false,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRevenueVsCosts(
    BuildContext context,
    Map<String, dynamic> billing,
  ) {
    final revenue = (billing['monthlyRevenue'] ?? 0.0) as num;
    final costs = (billing['monthlyCosts'] ?? 0.0) as num;
    final total = revenue + costs;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Bar visualization
          Row(
            children: [
              if (total > 0) ...[
                Expanded(
                  flex: (revenue / total * 100).round(),
                  child: Container(
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppColors.success,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(4),
                        bottomLeft: Radius.circular(4),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: (costs / total * 100).round(),
                  child: Container(
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: const BorderRadius.only(
                        topRight: Radius.circular(4),
                        bottomRight: Radius.circular(4),
                      ),
                    ),
                  ),
                ),
              ] else
                Expanded(
                  child: Container(
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppColors.grey200,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _LegendItem(
                  color: AppColors.success,
                  label: 'Revenue',
                  value: '\$${revenue.toStringAsFixed(2)}',
                ),
              ),
              Expanded(
                child: _LegendItem(
                  color: AppColors.error,
                  label: 'Costs',
                  value: '\$${costs.toStringAsFixed(2)}',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildApiCostsBreakdown(
    BuildContext context,
    Map<String, dynamic> billing,
  ) {
    final apiCosts = billing['apiCosts'] as Map<String, dynamic>? ?? {};

    final costs = [
      {
        'name': 'OpenAI',
        'cost': apiCosts['openai'] ?? 0.0,
        'icon': Iconsax.cpu,
        'color': const Color(0xFF10A37F)
      },
      {
        'name': 'Instagram',
        'cost': apiCosts['instagram'] ?? 0.0,
        'icon': Iconsax.instagram,
        'color': AppColors.instagram
      },
      {
        'name': 'Twitter',
        'cost': apiCosts['twitter'] ?? 0.0,
        'icon': Iconsax.message,
        'color': AppColors.twitter
      },
      {
        'name': 'LinkedIn',
        'cost': apiCosts['linkedin'] ?? 0.0,
        'icon': Iconsax.link,
        'color': AppColors.linkedin
      },
      {
        'name': 'WhatsApp',
        'cost': apiCosts['whatsapp'] ?? 0.0,
        'icon': Iconsax.message_text,
        'color': AppColors.whatsapp
      },
      {
        'name': 'Stripe Fees',
        'cost': apiCosts['stripe'] ?? 0.0,
        'icon': Iconsax.card,
        'color': const Color(0xFF635BFF)
      },
    ];

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: costs.length,
        separatorBuilder: (_, __) => Divider(
          height: 1,
          color: AppColors.grey100,
        ),
        itemBuilder: (context, index) {
          final item = costs[index];
          return ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: (item['color'] as Color).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                item['icon'] as IconData,
                color: item['color'] as Color,
                size: 20,
              ),
            ),
            title: Text(item['name'] as String),
            trailing: Text(
              '\$${(item['cost'] as num).toStringAsFixed(2)}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: AppColors.grey700,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRecentTransactions(
    BuildContext context,
    Map<String, dynamic> billing,
  ) {
    final transactions = List<Map<String, dynamic>>.from(
      billing['recentTransactions'] ?? [],
    );

    if (transactions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.grey200),
        ),
        child: Center(
          child: Text(
            'No recent transactions',
            style: TextStyle(color: AppColors.grey500),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: transactions.length.clamp(0, 10),
        separatorBuilder: (_, __) => Divider(
          height: 1,
          color: AppColors.grey100,
        ),
        itemBuilder: (context, index) {
          final tx = transactions[index];
          final isIncome = tx['type'] == 'income';
          final date = tx['date'] != null
              ? DateFormat('MMM d, yyyy').format(DateTime.parse(tx['date']))
              : '';

          return ListTile(
            leading: CircleAvatar(
              radius: 20,
              backgroundColor:
                  (isIncome ? AppColors.success : AppColors.error)
                      .withOpacity(0.1),
              child: Icon(
                isIncome ? Iconsax.arrow_down : Iconsax.arrow_up_1,
                color: isIncome ? AppColors.success : AppColors.error,
                size: 20,
              ),
            ),
            title: Text(tx['description'] ?? ''),
            subtitle: Text(date),
            trailing: Text(
              '${isIncome ? '+' : '-'}\$${(tx['amount'] ?? 0).toStringAsFixed(2)}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: isIncome ? AppColors.success : AppColors.error,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPaymentMethods(
    BuildContext context,
    Map<String, dynamic> billing,
  ) {
    final paymentMethods = List<Map<String, dynamic>>.from(
      billing['paymentMethods'] ?? [],
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (paymentMethods.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'No payment methods configured',
                style: TextStyle(color: AppColors.grey500),
              ),
            )
          else
            ...paymentMethods.map((method) {
              return ListTile(
                leading: Icon(
                  method['type'] == 'card' ? Iconsax.card : Iconsax.bank,
                  color: AppColors.primary,
                ),
                title: Text(method['name'] ?? 'Card'),
                subtitle: Text('**** **** **** ${method['last4'] ?? '****'}'),
                trailing: method['isDefault'] == true
                    ? Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'DEFAULT',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      )
                    : null,
              );
            }),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _showAddPaymentMethodDialog(context),
              icon: const Icon(Iconsax.add),
              label: const Text('Add Payment Method'),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddPaymentMethodDialog(BuildContext context) {
    final cardNumberController = TextEditingController();
    final expiryController = TextEditingController();
    final cvcController = TextEditingController();
    final nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Iconsax.card_add, color: AppColors.primary),
            const SizedBox(width: 12),
            const Text('Add Payment Method'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Cardholder Name',
                  hintText: 'John Doe',
                  prefixIcon: Icon(Iconsax.user, color: AppColors.grey500),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: cardNumberController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Card Number',
                  hintText: '4242 4242 4242 4242',
                  prefixIcon: Icon(Iconsax.card, color: AppColors.grey500),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: expiryController,
                      keyboardType: TextInputType.datetime,
                      decoration: InputDecoration(
                        labelText: 'Expiry',
                        hintText: 'MM/YY',
                        prefixIcon:
                            Icon(Iconsax.calendar, color: AppColors.grey500),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: cvcController,
                      keyboardType: TextInputType.number,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'CVC',
                        hintText: '123',
                        prefixIcon:
                            Icon(Iconsax.lock, color: AppColors.grey500),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.info.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.info.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Iconsax.shield_tick, color: AppColors.info, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your payment information is encrypted and secure.',
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
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (cardNumberController.text.isEmpty ||
                  expiryController.text.isEmpty ||
                  cvcController.text.isEmpty ||
                  nameController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please fill in all fields'),
                  ),
                );
                return;
              }

              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Payment method added successfully'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            child: const Text('Add Card'),
          ),
        ],
      ),
    );
  }
}

class _OverviewMetric extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final bool isPositive;

  const _OverviewMetric({
    required this.label,
    required this.value,
    required this.icon,
    required this.isPositive,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: Colors.white.withOpacity(0.8),
            size: 16,
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final String value;

  const _LegendItem({
    required this.color,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.grey500,
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
