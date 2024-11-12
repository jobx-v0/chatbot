const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_TOKEN_SECRET_KEY;
const FRONTEND_PORT = process.env.FRONTEND_PORT;
const DOMAIN = process.env.DOMAIN;
const FRONTEND_URL = `http://${DOMAIN}:${FRONTEND_PORT}/verify-interview`;

function getTimeRange(interviewDateTime) {
  const interviewDate = new Date(interviewDateTime);

  // Add 15 minutes
  const add15Mins = new Date(interviewDate.getTime() + 15 * 60 * 1000);

  // Subtract 15 minutes
  const subtract15Mins = new Date(interviewDate.getTime() - 15 * 60 * 1000);

  return {
    startTime: subtract15Mins.toISOString(),
    endTime: add15Mins.toISOString(),
  };
}

const generateMeetingLink = (user_id, job_id, interviewDateTime) => {
  const { startTime, endTime } = getTimeRange(interviewDateTime);

  const payload = {
    user_id,
    job_id,
    startTime,
    endTime,
  };

  const token = jwt.sign(payload, SECRET_KEY);

  const meetingLink = `${FRONTEND_URL}/${token}`;

  return meetingLink;
};

module.exports = {
  generateMeetingLink,
};
