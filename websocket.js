const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const temperatureRoutes = require('./routes/temperatureRoutes');

// Store all connected clients
const clients = new Set();

// Broadcast data to all connected clients
function broadcast(data) {
  const message = JSON.stringify({ type: 'data', data });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);
  
  // Send initial data when a client connects
  temperatureRoutes.getTemperatures()
    .then(data => {
      ws.send(JSON.stringify({ type: 'data', data }));
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

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the broadcast function to be used in other files
module.exports = { broadcast };
