const axios = require("axios");
const sleep = require("./sleep");

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

const getTokenHolders = async (chain, address, retryCount = 0) => {
  try {
    const url = `${process.env.BASE_URL}/v2/token/${chain}/${address}/info`;
    const data = await makeApiCall(url);
    const holders = data?.data?.holders;

    if (holders === undefined || holders === null) {
      throw new Error("No holder data found");
    }

    return holders;
  } catch (error) {
    if (retryCount < 2) {
      await sleep(process.env.API_RATE_LIMIT); // 1 second delay
      return getTokenHolders(chain, address, retryCount + 1);
    }
    return null;
  }
};

const getLiquidity = async (poolAddress, retryCount = 0) => {
  try {
    const url = `${process.env.BASE_URL}/v2/pool/ether/${poolAddress}/liquidity`;
    const data = await makeApiCall(url);
    return data?.data?.liquidity || 0;
  } catch (error) {
    if (retryCount < 2) {
      await sleep(process.env.API_RATE_LIMIT); // 1 second delay
      return getLiquidity(poolAddress, retryCount + 1);
    }
    throw error;
  }
};

module.exports = { makeApiCall, getLiquidity, getTokenHolders };
