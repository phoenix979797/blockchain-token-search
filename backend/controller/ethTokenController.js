const ETHToken = require("../model/ETHToken");

exports.getEthTokens = async (req, res) => {
  try {
    const tokens = await ETHToken.find();
    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
