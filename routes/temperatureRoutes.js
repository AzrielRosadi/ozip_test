const express = require("express");
const router = express.Router();
const pool = require("../db");

// ✅ GET rata-rata suhu (dipindah ke atas agar tidak bentrok dengan /:id)
router.get("/average", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT AVG(temperature) AS average FROM temperatures"
    );
    res.json({
      message: "Successfully retrieved average temperature",
      data: { average: parseFloat(result.rows[0].average).toFixed(2) },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error", data: null });
  }
});

// ✅ PATCH randomize suhu
router.patch("/randomize", async (req, res) => {
  try {
    const result = await pool.query("SELECT id FROM temperatures");
    for (const row of result.rows) {
      const randomTemp = (Math.random() * (35 - 20) + 20).toFixed(2);
      await pool.query(
        "UPDATE temperatures SET temperature = $1, updated_at = NOW() WHERE id = $2",
        [randomTemp, row.id]
      );
    }
    const updated = await pool.query(
      "SELECT * FROM temperatures ORDER BY id ASC"
    );
    res.json({
      message: "Successfully randomized all temperatures",
      data: updated.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error", data: null });
  }
});

// ✅ GET semua data suhu
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM temperatures ORDER BY id ASC"
    );
    res.json({
      message: "Successfully retrieved all data",
      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error", data: null });
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
      return res.status(404).json({ message: "Data not found", data: null });

    res.json({
      message: "Successfully retrieved data by ID",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error", data: null });
  }
});

// ✅ POST tambah data baru
router.post("/", async (req, res) => {
  try {
    const { city, temperature } = req.body;
    const result = await pool.query(
      "INSERT INTO temperatures (city, temperature, updated_at) VALUES ($1, $2, NOW()) RETURNING *",
      [city, temperature]
    );
    res.json({
      message: "Successfully created new data",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error", data: null });
  }
});

// ✅ PUT update data suhu
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { city, temperature } = req.body;
    const result = await pool.query(
      "UPDATE temperatures SET city = $1, temperature = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [city, temperature, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Data not found", data: null });

    res.json({
      message: "Successfully updated data",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error", data: null });
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
      return res.status(404).json({ message: "Data not found", data: null });

    res.json({
      message: "Successfully deleted data",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error", data: null });
  }
});

module.exports = router;
