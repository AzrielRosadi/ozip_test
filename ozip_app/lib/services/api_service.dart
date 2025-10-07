import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http/http.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import '../models/temperature.dart';
import '../models/dashboard_data.dart';

class ApiService {
  // Use 127.0.0.1 instead of localhost for better compatibility with Flutter web
  final String baseUrl = "http://127.0.0.1:3000";
  final String wsBaseUrl = "ws://127.0.0.1:3000";
  final Map<String, String> headers = {
    'Content-Type': 'application/json; charset=UTF-8',
  };
  
  // Stream controller for SSE events
  final StreamController<DashboardData> _dataController = StreamController<DashboardData>.broadcast();
  
  // Getter for the data stream
  Stream<DashboardData> get dataStream => _dataController.stream;
  
  // WebSocket channel for real-time updates
  WebSocketChannel? _channel;
  
  // Method to initialize WebSocket connection
  void initSSE() {
    try {
      _channel = WebSocketChannel.connect(
        Uri.parse('$wsBaseUrl/ws/temperatures'),
      );
      
      _channel!.stream.listen(
        (data) {
          try {
            final jsonData = jsonDecode(data);
            if (jsonData['type'] == 'data') {
              final dashboardData = DashboardData.fromJson(jsonData['data']);
              _dataController.add(dashboardData);
            }
          } catch (e) {
            print('Error processing WebSocket data: $e');
          }
        },
        onError: (error) {
          print('WebSocket Error: $error');
          // Attempt to reconnect after a delay
          Future.delayed(Duration(seconds: 5), () {
            if (_dataController.isClosed == false) {
              initSSE();
            }
          });
        },
        onDone: () {
          print('WebSocket connection closed');
          // Attempt to reconnect after a delay if not disposed
          if (!_dataController.isClosed) {
            Future.delayed(Duration(seconds: 5), () => initSSE());
          }
        },
        cancelOnError: true,
      );
    } catch (e) {
      print('Error initializing WebSocket: $e');
      // Retry connection after delay if not disposed
      if (!_dataController.isClosed) {
        Future.delayed(Duration(seconds: 5), () => initSSE());
      }
    }
  }
  
  // Close the WebSocket connection
  void dispose() {
    try {
      _channel?.sink.close(1000); // Normal closure
    } catch (e) {
      print('Error closing WebSocket: $e');
    }
    _dataController.close();
  }

  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  /// Mendapatkan data dashboard
  Future<DashboardData> getDashboardData() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/temperatures'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        if (responseData['data'] != null) {
          return DashboardData.fromJson(responseData['data']);
        }
      }
      throw Exception('Gagal memuat data dashboard');
    } catch (e) {
      print('Error saat mengambil data dashboard: $e');
      rethrow;
    }
  }

  /// Mendapatkan stream data dengan real-time updates
  Stream<DashboardData> getTemperatureStream() {
    // Initialize SSE connection if not already done
    if (_channel == null) {
      initSSE();
      
      // Get initial data
      getDashboardData().then((data) {
        if (_dataController.hasListener) {
          _dataController.add(data);
        }
      });
    }
    
    // Return the stream from the controller
    return _dataController.stream;
  }

  /// Menambahkan data suhu baru
  Future<Temperature> addTemperature(String city, double temperature) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/temperatures'),
        headers: headers,
        body: jsonEncode({'city': city, 'temperature': temperature}),
      );

      if (response.statusCode == 201) {
        return Temperature.fromJson(jsonDecode(response.body)['data']);
      } else {
        throw Exception('Gagal menambahkan data: ${response.statusCode}');
      }
    } catch (e) {
      print('Error saat menambahkan data: $e');
      rethrow;
    }
  }

  /// Memperbarui data suhu
  Future<Temperature> updateTemperature(
    int id,
    String city,
    double temperature,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/temperatures/$id'),
        headers: headers,
        body: jsonEncode({'city': city, 'temperature': temperature}),
      );

      if (response.statusCode == 200) {
        return Temperature.fromJson(jsonDecode(response.body)['data']);
      } else {
        throw Exception('Gagal update data: ${response.statusCode}');
      }
    } catch (e) {
      print('Error saat update data: $e');
      rethrow;
    }
  }

  /// Menghapus data suhu
  Future<void> deleteTemperature(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/temperatures/$id'),
        headers: headers,
      );

      if (response.statusCode != 200) {
        throw Exception('Gagal menghapus data: ${response.statusCode}');
      }
    } catch (e) {
      print('Error saat menghapus data: $e');
      rethrow;
    }
  }

  /// Mengacak semua suhu
  Future<void> randomizeTemperatures() async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/api/temperatures/randomize'),
        headers: headers,
      );

      if (response.statusCode != 200) {
        final errorData = jsonDecode(response.body);
        throw Exception(
          errorData['message'] ??
              'Gagal mengacak suhu (${response.statusCode})',
        );
      }
    } catch (e) {
      print('Error saat mengacak suhu: $e');
      rethrow;
    }
  }
}
