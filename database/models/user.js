const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: false },
    accessToken: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    premiumExpiry: { type: Date, default: null }
});

module.exports = mongoose.model("User", userSchema);
