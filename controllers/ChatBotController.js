const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const ChatHistory = require("../models/ChatbotsHistory");
const Job = require("../models/Job");
const { scheduleInterview } = require("./InterviewController");

const getCompanies = async (req, res) => {
  try {
    const user_id = req?.user?.id || req?.user?._id;

    const chatHistories = await ChatHistory.find({
      user_id: new ObjectId(user_id),
    });

    const jobIds = [
      ...new Set(chatHistories.map((chat) => chat.job_id.toString())),
    ];

    const jobs = await Job.find(
      { _id: { $in: jobIds.map((id) => new ObjectId(id)) } },
      { _id: 1, company_name: 1 }
    );

    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getChatHistory = async (req, res) => {
  const { job_id } = req.params;
  const user_id = req?.user?.id || req?.user?._id;

  try {
    const chatHistory = await ChatHistory.findOne({ user_id, job_id });

    if (!chatHistory) {
      return res.status(200).json({ chatHistory: [], nextOptions: [] });
    }

    res.status(200).json({
      chatHistory: chatHistory.messages,
      nextOptions: chatHistory.nextOptions,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getInterviewDateTime = async (user_id, job_id) => {
  try {
    const chatHistory = await ChatHistory.findOne({ user_id, job_id });

    if (!chatHistory || !chatHistory.interviewDateTime) {
      return "No interview date and time found";
    }

    const interviewDateTime = new Date(chatHistory.interviewDateTime);

    return interviewDateTime;
  } catch (error) {
    console.error("Error fetching interview date and time:", error);
    return null;
  }
};

const saveChatHistory = async (
  user_id,
  job_id,
  sender,
  message,
  nextOptions = null
) => {
  try {
    let chatHistory = await ChatHistory.findOne({ user_id, job_id });

    if (!chatHistory) {
      chatHistory = new ChatHistory({ user_id, job_id, messages: [] });
      chatHistory.messages.push({
        sender: "Bot",
        message: "Would you like to schedule an interview?",
      });
    }

    chatHistory.messages.push({ sender, message });

    if (nextOptions) {
      chatHistory.nextOptions = nextOptions;
    }

    await chatHistory.save();
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

const getNextOptions = async (req, res) => {
  const { job_id, userResponseValue, userResponseText, time, date } = req.body;

  const user_id = req?.user?.id || req?.user?._id;

  try {
    let response;

    await saveChatHistory(user_id, job_id, "User", userResponseText);

    if (
      userResponseValue === "schedule" ||
      userResponseValue === "reschedule" ||
      userResponseValue === "update-date"
    ) {
      response = {
        value: "input-date",
        nextMessage: "Please select a date for the interview:",
        nextOptions: [{ text: "Confirm Date", value: "input-date" }],
      };
    } else if (
      userResponseValue === "input-date" ||
      userResponseValue === "update-time"
    ) {
      response = {
        value: "input-time",
        nextMessage: "Please enter the time for the interview:",
        nextOptions: [{ text: "Confirm Time", value: "input-time" }],
      };
    } else if (userResponseValue === "input-time") {
      if (date === null) {
        response = {
          value: "input-date",
          nextMessage: "Please select a date for the interview:",
          nextOptions: [{ text: "Confirm Date", value: "input-date" }],
        };
      } else if (time === null) {
        response = {
          value: "input-time",
          nextMessage: "Please enter the time for the interview:",
          nextOptions: [{ text: "Confirm Time", value: "input-time" }],
        };
      } else {
        const dateTimeString = `${date}T${time}:00`;

        const interviewDateTime = new Date(dateTimeString).toISOString();

        await ChatHistory.updateOne(
          { user_id, job_id },
          { $set: { interviewDateTime } }
        );

        response = {
          nextMessage: `Your interview date: ${date} and time: ${time} are confirmed. Do you want to proceed?`,
          nextOptions: [
            { text: "Update Date", value: "update-date" },
            { text: "Update Time", value: "update-time" },
            { text: "Confirm", value: "confirm-schedule" },
          ],
        };
      }
    } else if (userResponseValue === "confirm-schedule") {
      let interviewDateTime = await getInterviewDateTime(user_id, job_id);

      let link = await scheduleInterview(user_id, job_id, interviewDateTime);

      response = {
        nextMessage: `Your interview has been scheduled. Here is your meeting link: ${link}`,
        nextOptions: [{ text: "Reschedule Interview", value: "reschedule" }],
      };
    } else {
      response = {
        nextMessage:
          "I'm sorry, I didn't understand that. Please select an option from the list.",
        nextOptions: [
          { text: "Schedule Interview", value: "schedule" },
          { text: "Reschedule Interview", value: "reschedule" },
        ],
      };
    }

    await saveChatHistory(
      user_id,
      job_id,
      "Bot",
      response.nextMessage,
      response.nextOptions
    );

    return res.json(response);
  } catch (error) {
    console.error(error);
    res.json({
      nextMessage:
        "I'm sorry, I didn't understand that. Please select an option from the list.",
      nextOptions: [
        { text: "Schedule Interview", value: "schedule" },
        { text: "Reschedule Interview", value: "reschedule" },
      ],
    });
  }
};

module.exports = {
  getCompanies,
  getNextOptions,
  getChatHistory,
};
