const mongoose = require("mongoose");
const crypto = require("crypto"); // For generating the salt and hashing the password

const { Schema } = mongoose;

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId, // Define _id as ObjectId type
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["candidate", "recruiter"],
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: false,
    trim: true,
  },
  isVerified: { type: Boolean, default: false },
  hashed_password: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: function () {
      return this.role === "recruiter";
    },
    trim: true,
  },
  interviews: [{ type: Schema.Types.ObjectId, ref: "Interview" }],
  created_at: { type: Date, default: Date.now },
  picture: { type: String }, // Stores the Google profile picture URL (imageUrl)
  isGoogleAuth: { type: Boolean, default: false },
  isProfileSubmitted: { type: Boolean, default: false },
  isParsedResume: { type: Boolean, default: false },
  isParsedResumeFirstTime: { type: Boolean, default: false },
});

userSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    if (!this.salt) {
      this.salt = crypto.randomBytes(16).toString("hex");
    }
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

userSchema.methods = {
  // Method to hash the password using the user's unique salt
  encryptPassword: function (password) {
    if (!password || !this.salt) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },

  // Method to authenticate the user by comparing the hashed password
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },
};

const User = mongoose.model("User", userSchema);

module.exports = User;
