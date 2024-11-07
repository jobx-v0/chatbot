const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ["User", "Bot"],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    nextOptions: [
      {
        text: String,
        value: String,
      },
    ],
    interviewDateTime: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "chatbots_history" }
);

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
module.exports = ChatHistory;
