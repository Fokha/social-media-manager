import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../../../core/theme/app_colors.dart';

class AnalyticsChart extends StatefulWidget {
  const AnalyticsChart({super.key});

  @override
  State<AnalyticsChart> createState() => _AnalyticsChartState();
}

class _AnalyticsChartState extends State<AnalyticsChart> {
  int _selectedPeriod = 0; // 0: Week, 1: Month, 2: Year

  // Demo data for different periods
  final Map<int, List<FlSpot>> _likesData = {
    0: [
      FlSpot(0, 45), FlSpot(1, 52), FlSpot(2, 48), FlSpot(3, 61),
      FlSpot(4, 55), FlSpot(5, 72), FlSpot(6, 68),
    ],
    1: [
      FlSpot(0, 180), FlSpot(1, 210), FlSpot(2, 195), FlSpot(3, 245),
      FlSpot(4, 220), FlSpot(5, 288), FlSpot(6, 275), FlSpot(7, 310),
      FlSpot(8, 295), FlSpot(9, 340), FlSpot(10, 320), FlSpot(11, 380),
    ],
    2: [
      FlSpot(0, 1200), FlSpot(1, 1450), FlSpot(2, 1380), FlSpot(3, 1620),
      FlSpot(4, 1550), FlSpot(5, 1890), FlSpot(6, 1780), FlSpot(7, 2100),
      FlSpot(8, 1950), FlSpot(9, 2340), FlSpot(10, 2180), FlSpot(11, 2560),
    ],
  };

  final Map<int, List<FlSpot>> _commentsData = {
    0: [
      FlSpot(0, 12), FlSpot(1, 18), FlSpot(2, 15), FlSpot(3, 22),
      FlSpot(4, 19), FlSpot(5, 28), FlSpot(6, 24),
    ],
    1: [
      FlSpot(0, 48), FlSpot(1, 72), FlSpot(2, 60), FlSpot(3, 88),
      FlSpot(4, 76), FlSpot(5, 112), FlSpot(6, 96), FlSpot(7, 124),
      FlSpot(8, 108), FlSpot(9, 140), FlSpot(10, 128), FlSpot(11, 156),
    ],
    2: [
      FlSpot(0, 320), FlSpot(1, 480), FlSpot(2, 400), FlSpot(3, 580),
      FlSpot(4, 500), FlSpot(5, 740), FlSpot(6, 640), FlSpot(7, 820),
      FlSpot(8, 720), FlSpot(9, 940), FlSpot(10, 850), FlSpot(11, 1040),
    ],
  };

  final Map<int, List<FlSpot>> _sharesData = {
    0: [
      FlSpot(0, 8), FlSpot(1, 12), FlSpot(2, 10), FlSpot(3, 15),
      FlSpot(4, 13), FlSpot(5, 19), FlSpot(6, 16),
    ],
    1: [
      FlSpot(0, 32), FlSpot(1, 48), FlSpot(2, 40), FlSpot(3, 60),
      FlSpot(4, 52), FlSpot(5, 76), FlSpot(6, 64), FlSpot(7, 84),
      FlSpot(8, 72), FlSpot(9, 96), FlSpot(10, 88), FlSpot(11, 108),
    ],
    2: [
      FlSpot(0, 210), FlSpot(1, 320), FlSpot(2, 265), FlSpot(3, 400),
      FlSpot(4, 345), FlSpot(5, 490), FlSpot(6, 425), FlSpot(7, 560),
      FlSpot(8, 480), FlSpot(9, 640), FlSpot(10, 580), FlSpot(11, 720),
    ],
  };

  List<String> get _bottomTitles {
    switch (_selectedPeriod) {
      case 0:
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 1:
        return ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
      case 2:
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      default:
        return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Engagement Overview',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.grey100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    _PeriodButton(
                      label: 'Week',
                      isSelected: _selectedPeriod == 0,
                      onTap: () => setState(() => _selectedPeriod = 0),
                    ),
                    _PeriodButton(
                      label: 'Month',
                      isSelected: _selectedPeriod == 1,
                      onTap: () => setState(() => _selectedPeriod = 1),
                    ),
                    _PeriodButton(
                      label: 'Year',
                      isSelected: _selectedPeriod == 2,
                      onTap: () => setState(() => _selectedPeriod = 2),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Legend
          Row(
            children: [
              _LegendItem(color: AppColors.primary, label: 'Likes'),
              const SizedBox(width: 16),
              _LegendItem(color: AppColors.secondary, label: 'Comments'),
              const SizedBox(width: 16),
              _LegendItem(color: AppColors.accent, label: 'Shares'),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: _getInterval(),
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: AppColors.grey200,
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index >= 0 && index < _bottomTitles.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              _bottomTitles[index],
                              style: TextStyle(
                                color: AppColors.grey500,
                                fontSize: 10,
                              ),
                            ),
                          );
                        }
                        return const SizedBox();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: _getInterval(),
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          _formatNumber(value),
                          style: TextStyle(
                            color: AppColors.grey500,
                            fontSize: 10,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: (_bottomTitles.length - 1).toDouble(),
                minY: 0,
                maxY: _getMaxY(),
                lineBarsData: [
                  _createLineBarData(_likesData[_selectedPeriod]!, AppColors.primary),
                  _createLineBarData(_commentsData[_selectedPeriod]!, AppColors.secondary),
                  _createLineBarData(_sharesData[_selectedPeriod]!, AppColors.accent),
                ],
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    tooltipBgColor: AppColors.grey800,
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) {
                        String label;
                        if (spot.barIndex == 0) {
                          label = 'Likes';
                        } else if (spot.barIndex == 1) {
                          label = 'Comments';
                        } else {
                          label = 'Shares';
                        }
                        return LineTooltipItem(
                          '$label: ${spot.y.toInt()}',
                          const TextStyle(color: Colors.white, fontSize: 12),
                        );
                      }).toList();
                    },
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Summary stats
          Row(
            children: [
              _SummaryCard(
                label: 'Total Likes',
                value: _getTotalLikes(),
                change: '+12.5%',
                isPositive: true,
              ),
              const SizedBox(width: 12),
              _SummaryCard(
                label: 'Total Comments',
                value: _getTotalComments(),
                change: '+8.3%',
                isPositive: true,
              ),
              const SizedBox(width: 12),
              _SummaryCard(
                label: 'Total Shares',
                value: _getTotalShares(),
                change: '+15.2%',
                isPositive: true,
              ),
            ],
          ),
        ],
      ),
    );
  }

  double _getInterval() {
    switch (_selectedPeriod) {
      case 0:
        return 20;
      case 1:
        return 100;
      case 2:
        return 800;
      default:
        return 20;
    }
  }

  double _getMaxY() {
    switch (_selectedPeriod) {
      case 0:
        return 80;
      case 1:
        return 400;
      case 2:
        return 2800;
      default:
        return 80;
    }
  }

  String _formatNumber(double value) {
    if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}k';
    }
    return value.toInt().toString();
  }

  String _getTotalLikes() {
    final total = _likesData[_selectedPeriod]!.fold<double>(0, (sum, spot) => sum + spot.y);
    return _formatNumber(total);
  }

  String _getTotalComments() {
    final total = _commentsData[_selectedPeriod]!.fold<double>(0, (sum, spot) => sum + spot.y);
    return _formatNumber(total);
  }

  String _getTotalShares() {
    final total = _sharesData[_selectedPeriod]!.fold<double>(0, (sum, spot) => sum + spot.y);
    return _formatNumber(total);
  }

  LineChartBarData _createLineBarData(List<FlSpot> spots, Color color) {
    return LineChartBarData(
      spots: spots,
      isCurved: true,
      color: color,
      barWidth: 2,
      isStrokeCapRound: true,
      dotData: const FlDotData(show: false),
      belowBarData: BarAreaData(
        show: true,
        color: color.withOpacity(0.1),
      ),
    );
  }
}

class _PeriodButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _PeriodButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.grey600,
          ),
        ),
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 3,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: AppColors.grey600,
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final String change;
  final bool isPositive;

  const _SummaryCard({
    required this.label,
    required this.value,
    required this.change,
    required this.isPositive,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.grey50,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: AppColors.grey500,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  change,
                  style: TextStyle(
                    fontSize: 10,
                    color: isPositive ? AppColors.success : AppColors.error,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
