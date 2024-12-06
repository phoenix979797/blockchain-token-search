const Token = require("../model/Token");

exports.tokenList = async (req, res) => {
  const { pageNum, pageSize } = req.query;
  try {
    const tokens = await Token.find().sort({ datetime: -1 });
    const [thieves] = await Token.aggregate([
      {
        $project: {
          value: {
            $add: [
              { $cond: [{ $ne: ["$addWallet", "N/A"] }, 1, 0] },
              { $cond: [{ $ne: ["$walletFirstTransaction", "N/A"] }, 1, 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$value" },
        },
      },
    ]);
    res.status(200).json({
      total: tokens?.length,
      thieves: thieves?.total,
      list: tokens
        .splice((Number(pageNum) - 1) * Number(pageSize), Number(pageSize))
        .map((t) => ({
          _id: t._id,
          name: t.name,
          datetime: t.datetime,
          tokenAddress: t.tokenAddress,
          addWallet: t.addWallet,
          walletFirstTransaction: t.walletFirstTransaction,
          nameAddWallet: t.nameAddWallet,
          nameWalletFirstTransaction: t.nameWalletFirstTransaction,
        })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.allList = async (req, res) => {
  try {
    const tokens = await Token.find().sort({ datetime: -1 });
    res.status(200).json(
      tokens.map((t) => ({
        name: t.name,
        datetime: t.datetime,
        tokenAddress: t.tokenAddress,
        addWallet: t.addWallet,
        walletFirstTransaction: t.walletFirstTransaction,
        nameAddWallet: t.nameAddWallet,
        nameWalletFirstTransaction: t.nameWalletFirstTransaction,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToken = async (req, res) => {
  const { datetime, addWallet, nameAddWallet, walletFirstTransaction } =
    req.body;
  try {
    const newToken = new Token({
      datetime,
      addWallet,
      nameAddWallet,
      walletFirstTransaction,
    });
    await newToken.save();
    res.status(200).json();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateToken = async (req, res) => {
  const { _id } = req.params;
  const { datetime, addWallet, nameAddWallet, walletFirstTransaction } =
    req.body;
  try {
    await Token.findOneAndUpdate(
      { _id },
      {
        datetime,
        addWallet,
        nameAddWallet,
        walletFirstTransaction,
      }
    );
    res.status(200).json();
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

exports.deleteAll = async (req, res) => {
  try {
    await Token.deleteMany();
    res.status(200).json();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
