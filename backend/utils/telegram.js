const axios = require("axios");

// Function to send a message to the Telegram chat
const sendTelegramMessage = async (message) => {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
      }
    );
    console.log("Telegram message sent:", response.data);
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
};

module.exports = { sendTelegramMessage };
