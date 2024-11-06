const Interview = require("../models/Interview");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const notifyInterview = async (
  user_id,
  job_id,
  interviewDateTime,
  meeting_link,
  isReSchedule
) => {
  try {
    const user = await User.findById(user_id);
    const toEmail = user.email;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: isReSchedule
        ? "ReScheduled Interview Reminder"
        : "Interview Reminder",
      text: `Hello,\n\nYour interview is scheduled for ${interviewDateTime.toLocaleString()}.\nJoin here: ${meeting_link}\n\nBest regards,`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);

        await Interview.updateOne(
          { user_id, job_id },
          { $set: { emailSent: true } }
        );
      }
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  notifyInterview,
};
