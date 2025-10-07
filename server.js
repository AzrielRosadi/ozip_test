const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 5000;

// Middleware
// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// Routes
// const usersRouter = require("./routes/users");
// const tasksRouter = require("./routes/tasks");

// app.use("/users", usersRouter);
// app.use("/tasks", tasksRouter);

// Root route
// app.get("/", (req, res) => {
//   res.send("Hello from the backend!");
// });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
