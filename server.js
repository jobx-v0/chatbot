const express = require("express");
const cron = require("node-cron");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

require("./Services/GenerateMeetingLink");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const chatBotRoutes = require("./routes/chatBotRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

app.use("/api", chatBotRoutes);
app.use("/api", interviewRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
