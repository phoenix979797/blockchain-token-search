const axios = require("axios");

const makeApiCall = async (url) => {
  try {
    const proxyUrl = url;

    const response = await axios(proxyUrl, {
      headers: {
        "X-API-KEY": process.env.API_KEY,
        accept: "application/json",
        "x-requested-with": "XMLHttpRequest",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${error.message}`);
    throw error;
  }
};

module.exports = { makeApiCall };
