const express = require("express");
const router = express.Router();
const InterviewController = require("../controllers/InterviewController");

router.get("/schedule-interview", InterviewController.scheduleInterview);

module.exports = router;
