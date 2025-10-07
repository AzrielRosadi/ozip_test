const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
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
