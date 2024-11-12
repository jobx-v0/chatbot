const Interview = require("../models/Interview");
const User = require("../models/User");
const path = require("path");
const ejs = require("ejs");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

    const templatePath = path.join(
      __dirname,
      "../assets/interview-template.html"
    );

    const htmlContent = await ejs.renderFile(templatePath, {
      subjectHeading: isReSchedule
        ? "Interview ReScheduled"
        : "Interview Scheduled",
      userName: user.username,
      scheduled: isReSchedule ? "rescheduled" : "scheduled",
      interviewDateTime: interviewDateTime.toLocaleString(),
      meetingLink: meeting_link,
    });

    const msg = {
      to: toEmail,
      from: "noreply@ruthi.in",
      subject: isReSchedule ? "Interview ReScheduled" : "Interview Scheduled",
      html: htmlContent,
    };

    await sgMail.send(msg);

    await Interview.updateOne(
      { user_id, job_id },
      { $set: { emailSent: true } }
    );
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  notifyInterview,
};
