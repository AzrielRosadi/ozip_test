import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AddTaskScreen extends StatefulWidget {
  const AddTaskScreen({super.key});

  @override
  State<AddTaskScreen> createState() => _AddTaskScreenState();
}

class _AddTaskScreenState extends State<AddTaskScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _isLoading = false;

  Future<void> _submitTask() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      // GANTI DENGAN IP LOKAL ANDA
      // - 10.0.2.2 untuk Android Emulator
      // - localhost untuk Windows/Web
      const url = 'http://10.0.2.2:5000/tasks';

      try {
        final response = await http.post(
          Uri.parse(url),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({
            'title': _titleController.text,
            'description': _descriptionController.text,
          }),
        );

        if (response.statusCode == 201) {
          // Jika sukses, kembali ke halaman sebelumnya
          Navigator.of(
            context,
          ).pop(true); // Kirim 'true' untuk menandakan sukses
        } else {
          // Tampilkan error jika gagal
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to add task: ${response.body}')),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('An error occurred: $e')));
      } finally {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add New Task')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a title';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              const SizedBox(height: 32),
              _isLoading
                  ? const CircularProgressIndicator()
                  : ElevatedButton(
                      onPressed: _submitTask,
                      child: const Text('Submit Task'),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
