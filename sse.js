const EventEmitter = require("events");
const { Pool } = require("pg");

class TemperatureStream extends EventEmitter {}

const temperatureStream = new TemperatureStream();
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "monitoring_suhu",
  password: "310307",
  port: 5432,
});

// Function to notify all connected clients
const notifyClients = async () => {
  try {
    const result = await pool.query(
      `SELECT 
        AVG(temperature) as average, 
        MIN(temperature) as min, 
        MAX(temperature) as max, 
        COUNT(*) as count 
       FROM temperatures`
    );

    const temps = await pool.query(
      "SELECT * FROM temperatures ORDER BY id ASC"
    );

    const data = {
      summary: result.rows[0],
      list: temps.rows,
    };

    temperatureStream.emit("update", data);
  } catch (err) {
    console.error("Error in notifyClients:", err);
  }
};

// Listen for changes in the database
const setupDatabaseListeners = async () => {
  const client = await pool.connect();

  // Listen for changes to the temperatures table
  await client.query("LISTEN temperature_changes");

  client.on("notification", (msg) => {
    if (msg.channel === "temperature_changes") {
      notifyClients();
    }
  });

  client.on("error", (err) => {
    console.error("Database connection error:", err);
    // Attempt to reconnect after a delay
    setTimeout(setupDatabaseListeners, 5000);
  });
};

// Initial setup
setupDatabaseListeners().catch(console.error);

// Export the stream and notify function
module.exports = { temperatureStream, notifyClients };
