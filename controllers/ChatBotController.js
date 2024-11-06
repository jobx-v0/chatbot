const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const ChatHistory = require("../models/ChatbotsHistory");
const Job = require("../models/Job");
const { scheduleInterview } = require("./InterviewController");

const getCompanies = async (req, res) => {
  try {
    const user_id = req?.user?.id || req?.user?._id;

    // Query to fetch all chat histories for the given user_id
    const chatHistories = await ChatHistory.find({
      user_id: new ObjectId(user_id),
    });

    // Extract unique job_ids from the chat histories
    const jobIds = [
      ...new Set(chatHistories.map((chat) => chat.job_id.toString())),
    ];

    // Fetch job details using jobIds, retrieving only _id and job_name fields
    const jobs = await Job.find(
      { _id: { $in: jobIds.map((id) => new ObjectId(id)) } },
      { _id: 1, company_name: 1 }
    );

    // Send the response with job _id and job_name
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
    // Fetch the document with user_id and job_id
    const chatHistory = await ChatHistory.findOne({ user_id, job_id });

    if (!chatHistory || !chatHistory.interviewDateTime) {
      return "No interview date and time found";
    }

    // Retrieve and format the interviewDateTime
    const interviewDateTime = new Date(chatHistory.interviewDateTime);

    // Format to 'YYYY-MM-DD' for date and 'HH:mm' for time
    // const date = interviewDateTime.toISOString().split("T")[0];
    // const time = interviewDateTime.toTimeString().split(" ")[0].slice(0, 5); // Extracting only HH:mm

    return interviewDateTime;
  } catch (error) {
    console.error("Error fetching interview date and time:", error);
    return null;
  }
};

// Function to save chat history
const saveChatHistory = async (
  user_id,
  job_id,
  sender,
  message,
  nextOptions = null
) => {
  try {
    // Find an existing chat history document for this user and job or create a new one
    let chatHistory = await ChatHistory.findOne({ user_id, job_id });

    if (!chatHistory) {
      chatHistory = new ChatHistory({ user_id, job_id, messages: [] });
      chatHistory.messages.push({
        sender: "Bot",
        message: "Would you like to schedule an interview?",
      });
    }

    // Append the new message to the messages array
    chatHistory.messages.push({ sender, message });

    // If nextOptions are provided, save them at the root level
    if (nextOptions) {
      chatHistory.nextOptions = nextOptions;
    }

    // Save the document
    await chatHistory.save();
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

const getNextOptions = async (req, res) => {
  const { job_id, userResponseValue, userResponseText, time, date } = req.body;

  const user_id = req?.user?.id || req?.user?._id;

  let response;

  // Save the user response in chat history
  await saveChatHistory(user_id, job_id, "User", userResponseText);

  // Step 1: Initial Schedule Request
  if (
    userResponseValue === "schedule" ||
    userResponseValue === "reschedule" ||
    userResponseValue === "update-date"
  ) {
    response = {
      value: "date",
      nextMessage: "Please select a date for the interview:",
      nextOptions: [{ text: "Confirm Date", value: "input-date" }],
    };
  } else if (
    userResponseValue === "input-date" ||
    userResponseValue === "update-time"
  ) {
    // const interviewDate = new Date(date);

    // // Save date and time in ISO format
    // await ChatHistory.updateOne(
    //   { user_id, job_id },
    //   { $set: { interviewDate } }
    // );

    response = {
      value: "time",
      nextMessage: "Please enter the time for the interview:",
      nextOptions: [{ text: "Confirm Time", value: "input-time" }],
    };
  } else if (userResponseValue === "input-time") {
    // Parse date and time components
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");

    // Create a Date object using UTC methods to ensure no timezone shift
    const interviewDateTime = new Date(
      Date.UTC(year, month - 1, day, hours, minutes)
    );

    // Save interviewDateTime in the database
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

  // Save the bot response in chat history
  await saveChatHistory(
    user_id,
    job_id,
    "Bot",
    response.nextMessage,
    response.nextOptions
  );

  return res.json(response);
};

module.exports = {
  getCompanies,
  getNextOptions,
  getChatHistory,
};
