import 'package:flutter/material.dart';
import 'add_task_screen.dart'; // Pastikan file ini ada
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const MyHomePage(title: 'Task List'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  List<dynamic> tasks = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    fetchTasks();
  }

  Future<void> fetchTasks() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });
    try {
      // GANTI DENGAN IP LOKAL ANDA
      // - 'http://10.0.2.2:5000/tasks' untuk Android Emulator
      // - 'http://localhost:5000/tasks' untuk Windows/Web (Chrome)
      const url = 'http://localhost:5000/tasks';
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        setState(() {
          tasks = json.decode(response.body);
        });
      } else {
        throw Exception(
          'Failed to load tasks. Status code: ${response.statusCode}',
        );
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error fetching tasks: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  void _navigateAndRefresh() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const AddTaskScreen()),
    );

    if (result == true) {
      fetchTasks();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: fetchTasks),
        ],
      ),
      body: Center(
        child: isLoading
            ? const CircularProgressIndicator()
            : errorMessage != null
            ? Text(errorMessage!, style: const TextStyle(color: Colors.red))
            : ListView.builder(
                itemCount: tasks.length,
                itemBuilder: (context, index) {
                  final task = tasks[index];
                  return ListTile(
                    title: Text(task['title'] ?? 'No Title'),
                    subtitle: Text(task['description'] ?? 'No Description'),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateAndRefresh,
        tooltip: 'Add Task',
        child: const Icon(Icons.add),
      ),
    );
  }
}
