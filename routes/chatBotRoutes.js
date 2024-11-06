const express = require("express");
const router = express.Router();
const ChatBotController = require("../controllers/ChatBotController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/getcompanies", authMiddleware, ChatBotController.getCompanies);

router.post(
  "/get-next-options",
  authMiddleware,
  ChatBotController.getNextOptions
);

router.get(
  "/chathistory/:job_id",
  authMiddleware,
  ChatBotController.getChatHistory
);

module.exports = router;
