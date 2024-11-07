const Interview = require("../models/Interview");
const emailServices = require("../Services/EmailServices");
const { generateMeetingLink } = require("../Services/GenerateMeetingLink");

const scheduleInterview = async (user_id, job_id, interviewDateTime) => {
  try {
    const meeting_link = generateMeetingLink(
      user_id,
      job_id,
      interviewDateTime
    );

    let interview = await Interview.findOne({ user_id, job_id });
    let isReSchedule = false;
    if (interview) {
      interview.scheduledTime = interviewDateTime;
      interview.platformLink = meeting_link;
      interview.updatedAt = Date.now();

      await interview.save();
      isReSchedule = true;
      console.log("Existing interview updated.");
    } else {
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
