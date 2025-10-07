const express = require("express");
const router = express.Router();
const db = require("../db"); // Mengasumsikan db.js ada di root

// Contoh route untuk mendapatkan semua user (data statis untuk sekarang)
router.get("/", (req, res) => {
  // Nantinya ini akan mengambil data dari database
  const users = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Doe" },
  ];
  res.json(users);
});

module.exports = router;
