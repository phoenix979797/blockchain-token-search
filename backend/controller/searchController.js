const AutoSearch = require("../model/AutoSearch");
const Token = require("../model/Token");

exports.getAutoSearchStatus = async (req, res) => {
  try {
    const data = await AutoSearch.findOne();
    let tokens = await Token.find().sort({ datetime: -1 });
    res.status(200).json({
      liquidityMin: data?.liquidityMin,
      liquidityMax: data?.liquidityMax,
      daysMin: data?.daysMin,
      daysMax: data?.daysMax,
      isProgress: data?.isProgress,
      tokenCount: tokens?.length,
      tokenList: tokens.splice(0, 75),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setAutoSearchStatus = async (req, res) => {
  const {
    daysMax = 7,
    daysMin = 0,
    liquidityMax = 10,
    liquidityMin = 0,
    isProgress,
  } = req.body;
  try {
    const autoInProgress = await AutoSearch.findOne({});
    if (!autoInProgress) {
      const newAutoSearch = new AutoSearch({
        daysMax,
        daysMin,
        liquidityMax,
        liquidityMin,
        isProgress,
      });
      await newAutoSearch.save();
    } else {
      await AutoSearch.findOneAndUpdate(
        {},
        { daysMax, daysMin, liquidityMax, liquidityMin, isProgress }
      );
    }
    console.log(`Auto Search ${isProgress ? "Start" : "Stop"}`);
    res.status(200).json();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
