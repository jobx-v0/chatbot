const mongoose = require("mongoose");

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
    answer: {
      type: String,
    },
  },
  { _id: false }
); // Prevent auto-generating an _id for this sub-document

const interviewSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    evaluation: {
      type: String,
      enum: ["not done", "in process", "completed"],
      default: "not done",
    },
    isInterviewCompleted: {
      type: Boolean,
      default: false,
    },
    interviewType: {
      type: String,
      enum: ["Technical", "HR"],
      required: true,
    },
    interviewQuestions: [interviewQuestionSchema], // Array of interview questions
    platformLink: {
      type: String, // Link to interview platform (e.g., Zoom, Google Meet)
      required: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "chatbot_interviews" }
);

// Middleware to update `updatedAt` on save
interviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Interview = mongoose.model("Interview", interviewSchema);
module.exports = Interview;
