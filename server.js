const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

const User = require("./database/models/user");

// Default Route (To prevent "Cannot GET /" errors)
app.get("/", (req, res) => {
    res.send("🌐 Cvine OAuth2 Backend is Running!");
});

// OAuth2 Callback Route
app.get("/oauth/callback", async (req, res) => {
    console.log("🔄 Received OAuth2 callback request:", req.query);

    const code = req.query.code;
    if (!code) {
        console.error("❌ No authorization code provided!");
        return res.status(400).send("❌ No authorization code provided! Try again.");
    }

    try {
        console.log("🔄 Exchanging code for access token...");

        // Exchange the code for an access token
        const response = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: process.env.REDIRECT_URI
        }).toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        console.log("✅ Successfully received access token!");

        const { access_token } = response.data;

        // Fetch user info from Discord API
        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userData = userResponse.data;
        console.log("✅ Successfully fetched user data:", userData);

        // Store user in MongoDB
        let user = await User.findOne({ userId: userData.id });
        if (!user) {
            user = new User({
                userId: userData.id,
                username: userData.username,
                email: userData.email || "N/A",
                accessToken: access_token,
                isPremium: false
            });
            await user.save();
        }

        res.send(`✅ Successfully linked your Discord account: ${userData.username}`);
    } catch (error) {
        console.error("❌ OAuth2 Error:", error.response ? error.response.data : error.message);
        res.status(500).send("❌ Error authorizing your Discord account.");
    }
});

// Start the Server
app.listen(PORT, () => console.log(`🌐 OAuth2 Server running on port ${PORT}`));
