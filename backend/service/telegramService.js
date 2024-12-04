const axios = require("axios");

const sendTelegramMessage = async (message) => {
  const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(telegramApiUrl, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    });
  } catch (error) {
    console.error("Error sending Telegram message", error);
  }
};

module.exports = { sendTelegramMessage };
