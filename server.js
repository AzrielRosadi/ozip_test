const express = require("express");
const http = require('http');
const bodyParser = require("body-parser");
const cors = require("cors");
const temperatureRoutes = require("./routes/temperatureRoutes");
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server, path: '/ws/temperatures' });

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);
  
  // Send initial data when a client connects
  temperatureRoutes.getTemperatures()
    .then(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data }));
      }
    })
    .catch(err => {
      console.error('Error sending initial data:', err);
    });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify({ type: 'data', data });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Make broadcast function available to routes
app.set('broadcast', broadcast);

// Configure CORS for development
const allowedOrigins = [
  'http://localhost',
  'http://localhost:8080',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
  'exp://',
];

// Enable CORS for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.some(allowedOrigin => origin?.startsWith(allowedOrigin))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  next();
});

app.use(bodyParser.json());

// ROUTES
app.use("/api/temperatures", temperatureRoutes.router);

// Fungsi untuk menampilkan daftar route
function printRoutes() {
  console.log('\n=== Daftar Route yang Tersedia ===');
  console.log('[GET] /api/health');
  console.log('[GET,POST] /api/temperatures');
  console.log('[GET,PUT,DELETE] /api/temperatures/:id');
  console.log('================================\n');
}

// Panggil fungsi printRoutes setelah server berjalan
setTimeout(printRoutes, 100);

// Endpoint untuk mengecek koneksi server
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server berjalan dengan baik' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    message: "Terjadi kesalahan server",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws/temperatures`);
});

// Export the server for testing
module.exports = { server, broadcast };
