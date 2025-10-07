const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: "postgres", // ganti dengan user PostgreSQL kamu
  host: "localhost",
  database: "monitoring_suhu", // ganti nama DB kamu
  password: "qwerty123", // password PostgreSQL kamu
  port: 5432,
});

pool.connect((err) => {
  if (err) {
    console.error("Connection error", err.stack);
  } else {
    console.log("Successfully connected to PostgreSQL database!");
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
