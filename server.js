const express = require('express');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');

// In-memory storage for scheduled interviews and their expiration
let scheduledInterviews = [];
const app = express();

// Use CORS middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Setup WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
let activeConnections = [];

// Manage WebSocket connections
wss.on('connection', (ws) => {
    activeConnections.push(ws);

    // Handle when the connection closes
    ws.on('close', () => {
        activeConnections = activeConnections.filter(conn => conn !== ws);
    });
});

// Email sending logic
app.post('/schedule-interview', (req, res) => {
    const { fullName, emailId, interviewDateTime } = req.body;

    // Store the interview schedule with expiration 2 hours after the scheduled time
    const expirationTime = new Date(new Date(interviewDateTime).getTime() + 2 * 60 * 60 * 1000);

    scheduledInterviews.push({
        fullName,
        emailId,
        interviewDateTime: new Date(interviewDateTime),
        expirationTime
    });

    // Respond to the user confirming the schedule
    res.status(200).json({
        message: 'Interview scheduled successfully! You will receive an email and a message reminder in this bot! All the best.',
        link: 'https://meet.google.com/ywa-ypkx-igt' // Send back the link
    });
});

// Endpoint to validate if the interview link is still valid
app.get('/validate-link', (req, res) => {
    const { emailId } = req.query;
    const interview = scheduledInterviews.find(interview => interview.emailId === emailId);

    if (interview) {
        const now = new Date();
        if (now < interview.expirationTime) {
            res.json({ message: 'The interview link is valid.' });
        } else {
            res.status(400).json({ message: 'The interview link has expired.' });
        }
    } else {
        res.status(404).json({ message: 'No interview found for this email.' });
    }
});

// Function to send interview link via email
function sendInterviewLink(fullName, emailId, interviewDateTime) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'chandanaparamesh101@gmail.com',
            pass: 'jppv vilu tomg fapb'
        }
    });

    const mailOptions = {
        from: 'chandanaparamesh101@gmail.com',
        to: emailId,
        subject: 'Interview Link',
        text: `Hello ${fullName},\n\nYour interview is scheduled for ${interviewDateTime.toLocaleString()}.\nJoin here: https://meet.google.com/ywa-ypkx-igt\n\nAll the Best,\nTeam Ruthi`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

// Function to send interview link to active chat sessions via WebSocket
function sendChatLink(fullName, interviewDateTime) {
    const message = `Hello ${fullName}, your interview is in one hour at ${interviewDateTime.toLocaleString()}.`;

    // Broadcast to all active WebSocket connections
    activeConnections.forEach((conn) => {
        conn.send(JSON.stringify({ message }));
    });
}

// Cron job to send email and WebSocket reminders one hour before interviews
cron.schedule('* * * * *', () => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // Current time + 1 hour

    scheduledInterviews.forEach((interview, index) => {
        if (interview.interviewDateTime <= oneHourFromNow && interview.interviewDateTime > now) {
            // Send the interview link via email
            sendInterviewLink(interview.fullName, interview.emailId, interview.interviewDateTime);

            // Send the interview link via WebSocket (chat message)
            sendChatLink(interview.fullName, interview.interviewDateTime);

            // Remove the interview from the list after sending the reminder
            scheduledInterviews.splice(index, 1);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});