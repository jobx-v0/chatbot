const Interview = require("../models/Interview");
const emailServices = require("../Services/EmailServices");

const scheduleInterview = async (user_id, job_id, interviewDateTime) => {
  try {
    const meeting_link = "https://meet.google.com/example-link";

    // Check if an interview already exists for this user and job
    let interview = await Interview.findOne({ user_id, job_id });
    let isReSchedule = false;
    if (interview) {
      // If an interview already exists, update it
      interview.scheduledTime = interviewDateTime;
      interview.platformLink = meeting_link;
      interview.updatedAt = Date.now();

      await interview.save();
      isReSchedule = true;
      console.log("Existing interview updated.");
    } else {
      // If no existing interview, create a new one
      interview = new Interview({
        user_id,
        job_id,
        scheduledTime: interviewDateTime,
        interviewType: "Technical",
        platformLink: meeting_link,
      });
      await interview.save();
      console.log("New interview scheduled.");
    }

    // Send email notification
    emailServices.notifyInterview(
      user_id,
      job_id,
      interviewDateTime,
      meeting_link,
      isReSchedule
    );

    return meeting_link;
  } catch (error) {
    console.error("Error scheduling or updating interview:", error);
  }
};

module.exports = {
  scheduleInterview,
};
