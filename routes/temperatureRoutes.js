const express = require("express");
const router = express.Router();
const { query, connect } = require("../db");

// Helper function to calculate summary stats
async function calculateSummary() {
  const result = await query(
    `SELECT 
       COUNT(*) as count,
       AVG(temperature) as average,
       MIN(temperature) as min,
       MAX(temperature) as max
     FROM temperatures`
  );
  return result.rows[0];
}

// Get all temperatures with summary
async function getTemperatures() {
  const [temperatures, summary] = await Promise.all([
    query("SELECT * FROM temperatures ORDER BY id DESC"),
    calculateSummary()
  ]);

  return {
    summary: {
      count: parseInt(summary.count),
      average: parseFloat(summary.average || 0).toFixed(2),
      min: parseFloat(summary.min || 0).toFixed(2),
      max: parseFloat(summary.max || 0).toFixed(2)
    },
    list: temperatures.rows
  };
}

// Notify all connected clients with updated data
async function notifyClients(req) {
  try {
    const data = await getTemperatures();
    const broadcast = req.app.get('broadcast');
    if (broadcast) {
      broadcast(data);
    } else {
      console.warn('Broadcast function not available');
    }
  } catch (err) {
    console.error('Error notifying clients:', err);
  }
}

// GET semua data suhu
router.get("/", async (req, res) => {
  try {
    const data = await getTemperatures();
    res.json({
      success: true,
      message: "Data suhu berhasil diambil",
      data: data
    });
  } catch (err) {
    console.error("Error fetching temperatures:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data suhu",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ GET rata-rata suhu
router.get("/average", async (req, res) => {
  try {
    const result = await query(
      "SELECT AVG(temperature) AS average FROM temperatures"
    );
    res.json({
      message: "Successfully retrieved average temperature",
      data: { average: parseFloat(result.rows[0].average || 0).toFixed(2) },
    });
  } catch (err) {
    console.error('Error in GET /average:', err);
    res.status(500).json({ 
      message: "Server Error", 
      error: process.env.NODE_ENV === 'development' ? err.message : null 
    });
  }
});

// ✅ PATCH randomize suhu
router.patch("/randomize", async (req, res) => {
  console.log('1. Received request to randomize temperatures');
  let client;
  
  try {
    console.log('2. Getting database connection...');
    client = await connect();
    
    console.log('3. Starting transaction...');
    await client.query('BEGIN');
    
    console.log('4. Fetching temperature records...');
    const result = await query("SELECT id, city FROM temperatures");
    console.log(`5. Found ${result.rows.length} records`);
    
    if (!result.rows || result.rows.length === 0) {
      console.log('No temperature records found');
      return res.status(200).json({ 
        success: true,
        message: "No temperature records found",
        data: [] 
      });
    }
    
    console.log('6. Starting to update records...');
    const updates = [];
    
    for (const row of result.rows) {
      const randomTemp = (Math.random() * (35 - 20) + 20).toFixed(2);
      console.log(`   - Updating ${row.city} (ID: ${row.id}) to ${randomTemp}°C`);
      
      updates.push(
        query(
          "UPDATE temperatures SET temperature = $1 WHERE id = $2 RETURNING *",
          [randomTemp, row.id]
        )
      );
    }
    
    console.log('7. Waiting for all updates to complete...');
    const updateResults = await Promise.all(updates);
    
    console.log('8. Committing transaction...');
    await client.query('COMMIT');
    
    console.log('9. Successfully randomized temperatures');
    
    // Get latest data
    console.log('10. Fetching updated records...');
    const updated = await query("SELECT * FROM temperatures ORDER BY id ASC");
    console.log('11. Successfully fetched updated records');
    
    // Notify all connected clients
    await notifyClients(req);
    
    res.status(200).json({
      success: true,
      message: `Successfully randomized ${updateResults.length} temperature records`,
      data: updated.rows,
    });
    
  } catch (err) {
    console.error('Error in PATCH /randomize:', err);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: "Gagal mengacak suhu. Silakan coba lagi.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    if (client) {
      try {
        await client.release();
      } catch (releaseErr) {
        console.error('Error releasing client:', releaseErr);
      }
    }
  }
});

// ✅ GET data suhu berdasarkan ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT * FROM temperatures WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `Temperature with ID ${id} not found`,
        data: null,
      });
    }
    res.json({
      message: "Successfully retrieved temperature",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(`Error in GET /${req.params.id}:`, err);
    res.status(500).json({ 
      message: "Server Error", 
      error: process.env.NODE_ENV === 'development' ? err.message : null 
    });
  }
});

// ✅ POST data suhu baru
router.post("/", async (req, res) => {
  const client = await connect();
  try {
    const { city, temperature } = req.body;
    
    if (!city || temperature === undefined) {
      return res.status(400).json({
        message: "City and temperature are required",
        data: null,
      });
    }
    
    await client.query('BEGIN');
    
    const result = await query(
      "INSERT INTO temperatures (city, temperature) VALUES ($1, $2) RETURNING *",
      [city, parseFloat(temperature)]
    );
    
    await query('NOTIFY temperature_changes');
    await client.query('COMMIT');
    
    // Notify all connected clients
    await notifyClients(req);
    
    res.status(201).json({
      message: "Successfully created new temperature record",
      data: result.rows[0],
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    console.error('Error in POST /:', err);
    res.status(500).json({ message: "Server Error", data: null });
  } finally {
    client.release();
  }
});

// ✅ PUT update data suhu
router.put("/:id", async (req, res) => {
  const client = await connect();
  try {
    const { id } = req.params;
    const { city, temperature } = req.body;
    
    if (!city || temperature === undefined) {
      return res.status(400).json({
        message: "City and temperature are required",
        data: null,
      });
    }
    
    await client.query('BEGIN');
    
    const result = await query(
      "UPDATE temperatures SET city = $1, temperature = $2 WHERE id = $3 RETURNING *",
      [city, parseFloat(temperature), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `Temperature with ID ${id} not found`,
        data: null,
      });
    }
    
    await query('NOTIFY temperature_changes');
    await client.query('COMMIT');
    
    // Notify all connected clients
    await notifyClients(req);
    
    res.json({
      message: "Successfully updated temperature record",
      data: result.rows[0],
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    console.error(`Error in PUT /${req.params.id}:`, err);
    res.status(500).json({ message: "Server Error", data: null });
  } finally {
    client.release();
  }
});

// ✅ DELETE data suhu
router.delete("/:id", async (req, res) => {
  const client = await connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    const result = await query(
      "DELETE FROM temperatures WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `Temperature with ID ${id} not found`,
        data: null,
      });
    }
    
    await query('NOTIFY temperature_changes');
    await client.query('COMMIT');
    
    // Notify all connected clients
    await notifyClients(req);
    
    res.json({
      message: "Successfully deleted temperature record",
      data: result.rows[0],
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during rollback:', rollbackErr);
      }
    }
    console.error(`Error in DELETE /${req.params.id}:`, err);
    res.status(500).json({ message: "Server Error", data: null });
  } finally {
    client.release();
  }
});

// Ekspor router dan fungsi getTemperatures
module.exports = {
  router,
  getTemperatures,
  notifyClients
};
