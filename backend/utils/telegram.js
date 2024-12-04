const axios = require("axios");
const { WebClient } = require("@slack/web-api");

const web = new WebClient(process.env.SLACK_APP_TOKEN);

// Function to send a message to the Telegram chat
const sendTelegramMessage = async (message) => {
  try {
    await web.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID,
      text: message,
    });
    // const response = await axios.post(
    //   `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    //   {
    //     chat_id: process.env.TELEGRAM_CHAT_ID,
    //     text: message,
    //   }
    // );
    console.log("Telegram message sent:", response.data);
  } catch (error) {
    // console.error("Error sending message to Telegram:", error);
    console.error("Error sending message to Telegram:");
  }
};

module.exports = { sendTelegramMessage };
