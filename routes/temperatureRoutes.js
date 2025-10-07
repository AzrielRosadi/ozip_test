const express = require("express");
const router = express.Router();
const pool = require("../db");

// ✅ GET semua data suhu
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM temperatures ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ GET data suhu berdasarkan ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM temperatures WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Data tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ POST tambah data baru
router.post("/", async (req, res) => {
  try {
    const { city, temperature } = req.body;
    const result = await pool.query(
      "INSERT INTO temperatures (city, temperature) VALUES ($1, $2) RETURNING *",
      [city, temperature]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ PUT update data suhu
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { city, temperature } = req.body;
    const result = await pool.query(
      "UPDATE temperatures SET city = $1, temperature = $2 WHERE id = $3 RETURNING *",
      [city, temperature, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Data tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ DELETE hapus data
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM temperatures WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Data tidak ditemukan" });
    res.json({ message: "Data berhasil dihapus" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
