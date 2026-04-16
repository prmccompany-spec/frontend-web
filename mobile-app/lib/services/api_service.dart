import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  final String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api';
  final int timeout = int.parse(dotenv.env['API_TIMEOUT'] ?? '30');

  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl$endpoint'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode(data),
          )
          .timeout(Duration(seconds: timeout));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Request failed');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<Map<String, dynamic>> get(String endpoint, {String? token}) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http
          .get(
            Uri.parse('$baseUrl$endpoint'),
            headers: headers,
          )
          .timeout(Duration(seconds: timeout));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized - Token expired');
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Request failed');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
