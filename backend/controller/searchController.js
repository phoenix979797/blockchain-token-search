const AutoSearch = require("../model/AutoSearch");

exports.getAutoSearchStatus = async (req, res) => {
  try {
    const data = await AutoSearch.findOne();
    res.status(200).json(data);
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
