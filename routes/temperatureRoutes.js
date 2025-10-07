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

// ✅ GET rata-rata suhu
router.get("/average", async (req, res) => {
  try {
    const result = await pool.query("SELECT AVG(temperature) AS average FROM temperatures");
    res.json({ average: parseFloat(result.rows[0].average).toFixed(2) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ PATCH randomize suhu (update semua suhu dengan angka acak)
router.patch("/randomize", async (req, res) => {
  try {
    const result = await pool.query("SELECT id FROM temperatures");
    for (const row of result.rows) {
      const randomTemp = (Math.random() * (35 - 20) + 20).toFixed(2); // acak 20–35°C
      await pool.query("UPDATE temperatures SET temperature = $1 WHERE id = $2", [randomTemp, row.id]);
    }
    const updated = await pool.query("SELECT * FROM temperatures ORDER BY id ASC");
    res.json({
      message: "Suhu berhasil diacak ulang",
      data: updated.rows,
    });
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
