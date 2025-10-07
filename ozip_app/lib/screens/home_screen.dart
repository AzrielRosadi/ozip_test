import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/dashboard_data.dart';
import '../models/temperature.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  late Stream<DashboardData> _dashboardStream;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      _dashboardStream = _apiService.getTemperatureStream();
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  // Add this method if you need to handle randomize functionality
  void _handleRandomize() {
    // Implement your randomize logic here
    // For example, you can call _loadData() to refresh the data
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Monitoring Suhu', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.blue[800],
        elevation: 2,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? _buildLoading()
          : _error != null
          ? _buildError()
          : _buildDashboard(),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
        child: Icon(Icons.add, color: Colors.white),
        backgroundColor: Colors.blue[800],
      ),
    );
  }

  Widget _buildLoading() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Memuat data...'),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, color: Colors.red, size: 48),
          SizedBox(height: 16),
          Text('Gagal memuat data'),
          Text(
            _error ?? 'Terjadi kesalahan',
            style: TextStyle(color: Colors.red),
          ),
          SizedBox(height: 16),
          ElevatedButton(onPressed: _loadData, child: Text('Coba Lagi')),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    return StreamBuilder<DashboardData>(
      stream: _dashboardStream,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _buildError();
        }

        if (!snapshot.hasData) {
          return _buildLoading();
        }

        final data = snapshot.data!;
        return RefreshIndicator(
          onRefresh: _loadData,
          child: SingleChildScrollView(
            physics: AlwaysScrollableScrollPhysics(),
            child: Column(
              children: [
                _buildSummaryCards(data.summary),
                _buildTemperatureList(data.list),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSummaryCards(SummaryStats summary) {
    return Card(
      margin: EdgeInsets.all(16),
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ringkasan Suhu',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.blue[800],
              ),
            ),
            SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildSummaryItem(
                  'Rata-rata',
                  '${double.tryParse(summary.average)?.toStringAsFixed(1) ?? '0.0'}°C',
                  Icons.thermostat,
                  Colors.blue,
                ),
                _buildSummaryItem(
                  'Tertinggi',
                  '${double.tryParse(summary.max)?.toStringAsFixed(1) ?? '0.0'}°C',
                  Icons.arrow_upward,
                  Colors.red,
                ),
                _buildSummaryItem(
                  'Terendah',
                  '${double.tryParse(summary.min)?.toStringAsFixed(1) ?? '0.0'}°C',
                  Icons.arrow_downward,
                  Colors.green,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        Text(title, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildTemperatureList(List<Temperature> items) {
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Text(
            'Tidak ada data suhu tersedia',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Dismissible(
          key: Key(item.id.toString()),
          background: Container(
            color: Colors.red,
            alignment: Alignment.centerRight,
            padding: EdgeInsets.only(right: 20),
            child: Icon(Icons.delete, color: Colors.white),
          ),
          direction: DismissDirection.endToStart,
          confirmDismiss: (direction) => _showDeleteConfirmation(item.id),
          child: Card(
            margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: _getTemperatureColor(
                  item.temperature,
                ).withOpacity(0.2),
                child: Icon(
                  Icons.thermostat,
                  color: _getTemperatureColor(item.temperature),
                ),
              ),
              title: Text(
                item.city,
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              subtitle: Text('ID: ${item.id} • ${_formatTime(DateTime.now())}'),
              trailing: Text(
                '${item.temperature.toStringAsFixed(1)}°C',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: _getTemperatureColor(item.temperature),
                ),
              ),
              onTap: () => _showEditDialog(item),
            ),
          ),
        );
      },
    );
  }

  Color _getTemperatureColor(double temperature) {
    if (temperature > 30) return Colors.red;
    if (temperature < 20) return Colors.blue;
    return Colors.green;
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _showAddDialog() async {
    final cityController = TextEditingController();
    final tempController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Tambah Data Suhu'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: cityController,
                  decoration: InputDecoration(
                    labelText: 'Nama Kota',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) => value?.isEmpty ?? true
                      ? 'Nama kota tidak boleh kosong'
                      : null,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: tempController,
                  decoration: InputDecoration(
                    labelText: 'Suhu (°C)',
                    border: OutlineInputBorder(),
                    suffixText: '°C',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value?.isEmpty ?? true)
                      return 'Suhu tidak boleh kosong';
                    final temp = double.tryParse(value!);
                    if (temp == null) return 'Masukkan angka yang valid';
                    return null;
                  },
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('BATAL'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (formKey.currentState?.validate() ?? false) {
                try {
                  await _apiService.addTemperature(
                    cityController.text,
                    double.parse(tempController.text),
                  );
                  if (mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Data berhasil ditambahkan')),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Gagal menambahkan data: $e')),
                    );
                  }
                }
              }
            },
            child: Text('SIMPAN'),
          ),
        ],
      ),
    );
  }

  Future<void> _showEditDialog(Temperature item) async {
    final cityController = TextEditingController(text: item.city);
    final tempController = TextEditingController(
      text: item.temperature.toString(),
    );
    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit Data Suhu'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: cityController,
                  decoration: InputDecoration(
                    labelText: 'Nama Kota',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) => value?.isEmpty ?? true
                      ? 'Nama kota tidak boleh kosong'
                      : null,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: tempController,
                  decoration: InputDecoration(
                    labelText: 'Suhu (°C)',
                    border: OutlineInputBorder(),
                    suffixText: '°C',
                  ),
                  keyboardType: TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value?.isEmpty ?? true)
                      return 'Suhu tidak boleh kosong';
                    final temp = double.tryParse(value!);
                    if (temp == null) return 'Masukkan angka yang valid';
                    return null;
                  },
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('BATAL'),
          ),
          TextButton(
            onPressed: () => _deleteTemperature(item.id),
            child: Text('HAPUS', style: TextStyle(color: Colors.red)),
          ),
          ElevatedButton(
            onPressed: () async {
              if (formKey.currentState?.validate() ?? false) {
                try {
                  await _apiService.updateTemperature(
                    item.id,
                    cityController.text,
                    double.parse(tempController.text),
                  );
                  if (mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Data berhasil diperbarui')),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Gagal memperbarui data: $e')),
                    );
                  }
                }
              }
            },
            child: Text('SIMPAN'),
          ),
        ],
      ),
    );
  }

  Future<bool> _showDeleteConfirmation(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Hapus Data'),
        content: Text('Apakah Anda yakin ingin menghapus data ini?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('BATAL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('HAPUS', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _deleteTemperature(id);
      return true;
    }
    return false;
  }

  Future<void> _deleteTemperature(int id) async {
    try {
      await _apiService.deleteTemperature(id);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Data berhasil dihapus')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Gagal menghapus data: $e')));
      }
    }
  }
}
