const Token = require("../model/Token");

exports.tokenList = async (req, res) => {
  try {
    const tokens = await Token.find();
    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateToken = async (req, res) => {
  const { _id } = req.params;
  const { name } = req.body;
  try {
    await Token.findOneAndUpdate({ _id }, { name });
    const tokens = await Token.find();
    res.status(200).json(tokens);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteToken = async (req, res) => {
  const { _id } = req.params;
  try {
    await Token.findByIdAndDelete(_id);
    res.status(200).json();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
