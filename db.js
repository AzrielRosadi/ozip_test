const { Pool } = require("pg");
require("dotenv").config();

// Buat instance pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432, // Default port 5432 jika tidak didefinisikan
});

// Tes koneksi
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to PostgreSQL database:", err.stack);
  } else {
    console.log("Successfully connected to PostgreSQL database!");
    release(); // Lepas client kembali ke pool
  }
});

// Ekspor pool dan method query
module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect()
};
