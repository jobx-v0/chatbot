const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const DATABASE_URL =
      process.env.MONGODB_URI || "mongodb://localhost:27017/dev";
    await mongoose.connect(DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
