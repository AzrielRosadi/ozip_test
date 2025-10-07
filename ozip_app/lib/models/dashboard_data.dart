// lib/models/dashboard_data.dart
import 'temperature.dart';

class DashboardData {
  final SummaryStats summary;
  final List<Temperature> list;

  DashboardData({required this.summary, required this.list});

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    var tempList = json['list'] as List;
    List<Temperature> temperatureList = tempList
        .map((i) => Temperature.fromJson(i))
        .toList();

    return DashboardData(
      summary: SummaryStats.fromJson(json['summary']),
      list: temperatureList,
    );
  }
}

class SummaryStats {
  final String average;
  final String min;
  final String max;
  final int count;

  SummaryStats({
    required this.average,
    required this.min,
    required this.max,
    required this.count,
  });

  factory SummaryStats.fromJson(Map<String, dynamic> json) {
    return SummaryStats(
      average: json['average'].toString(),
      min: json['min'].toString(),
      max: json['max'].toString(),
      count: json['count'],
    );
  }
}
