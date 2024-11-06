const express = require("express");
const cron = require("node-cron");
const cors = require("cors");
const path = require("path");
// const WebSocket = require("ws");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Set up WebSocket server
// const wss = new WebSocket.Server({ port: 8090 });

const chatBotRoutes = require("./routes/chatBotRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

app.use("/api", chatBotRoutes);
app.use("/api", interviewRoutes);

// Add this endpoint to your server.js file

// Fetch company names
// app.get("/companies", async (req, res) => {
//   try {
//     // Fetch companies from the Interview collection, ensuring to select the correct field
//     const companies = await Interview.find({}, "company_name"); // Adjusting to the correct field name
//     const companyNames = companies.map((company) => company.company_name); // Using company_name to get the values
//     res.json(companyNames);
//   } catch (error) {
//     console.error("Error fetching companies:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// wss.on("connection", async (ws) => {
//   // Create a new WebSocket connection entry in the database
//   const connection = new WebSocketConnection({ id: ws._socket.remoteAddress });
//   await connection.save();

//   ws.on("close", async () => {
//     // Remove the WebSocket connection entry from the database
//     await WebSocketConnection.deleteOne({ id: ws._socket.remoteAddress });
//   });

//   // Listen for messages and handle accordingly
//   ws.on("message", (message) => {
//     console.log("Received:", message);
//   });
// });

// API to schedule Interview
// app.post("/schedule-interview", async (req, res) => {
//   const { userId, interviewDate, interviewTime } = req.body;

//   // Combine date and time into a single Date object
//   const interviewDateTime = new Date(`${interviewDate}T${interviewTime}`);
//   const expirationTime = new Date(
//     interviewDateTime.getTime() + 2 * 60 * 60 * 1000
//   ); // 2 hours expiration

//   const newInterview = new Interview({
//     userId,
//     interviewDateTime,
//     expirationTime,
//   });
//   await newInterview.save();

//   // Send email notification
//   notifyInterview(userId, interviewDateTime);

//   res.status(200).json({
//     message: "Interview scheduled successfully!",
//     link: "https://meet.google.com/example-link",
//   });
// });

// API to validate link expiration
// app.get("/validate-link", async (req, res) => {
//   const { userId } = req.query;
//   const interview = await Interview.findOne({ userId });

//   if (interview) {
//     const now = new Date();
//     if (now < interview.expirationTime) {
//       res.json({ message: "The interview link is valid." });
//     } else {
//       res.status(400).json({ message: "The interview link has expired." });
//     }
//   } else {
//     res.status(404).json({ message: "No interview found for this user ID." });
//   }
// });

// Email and WebSocket notification function
// Email and WebSocket notification function
// async function notifyInterview(userId, interviewDateTime) {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER, // Use environment variable
//       pass: process.env.EMAIL_PASS, // Use environment variable
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: userId, // Assuming userId is the email here
//     subject: "Interview Reminder",
//     text: `Hello,\n\nYour interview is scheduled for ${interviewDateTime.toLocaleString()}.\nJoin here: https://meet.google.com/example-link\n\nBest regards,`,
//   };

//   transporter.sendMail(mailOptions, async (error, info) => {
//     if (error) {
//       console.error("Error sending email:", error);
//     } else {
//       console.log("Email sent:", info.response);
//       // After sending the email, update the email_sent field in the database
//       await Interview.updateOne(
//         { userId, interviewDateTime },
//         { $set: { email_sent: true } }
//       );
//     }
//   });

//   // Fetch all active WebSocket connections from the database and notify them
//   WebSocketConnection.find().then((connections) => {
//     const message = `Reminder: Your interview is scheduled for ${interviewDateTime.toLocaleString()}.`;
//     connections.forEach((conn) => {
//       const ws = wss.clients.find(
//         (client) => client._socket.remoteAddress === conn.id
//       );
//       if (ws) {
//         ws.send(JSON.stringify({ message }));
//       }
//     });
//   });
// }

// Cron job to send reminders one hour before interviews
// cron.schedule("* * * * *", async () => {
//   const now = new Date();
//   const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

//   const interviews = await Interview.find({
//     interviewDateTime: { $lte: oneHourFromNow, $gt: now },
//   });

//   interviews.forEach(async (interview) => {
//     notifyInterview(interview.userId, interview.interviewDateTime);
//     await Interview.deleteOne({ _id: interview._id });
//   });
// });

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
