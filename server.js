const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const temperatureRoutes = require("./routes/temperatureRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ROUTES
app.use("/api/temperatures", temperatureRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
