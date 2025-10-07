class Temperature {
  final int id;
  final String city;
  final double temperature;

  Temperature({
    required this.id,
    required this.city,
    required this.temperature,
  });

  factory Temperature.fromJson(Map<String, dynamic> json) {
    return Temperature(
      id: json['id'],
      city: json['city'],
      temperature: double.parse(json['temperature'].toString()),
    );
  }
}
