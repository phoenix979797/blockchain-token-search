const express = require("express");
const {
  tokenList,
  updateToken,
  deleteToken,
} = require("../controller/tokenController");
const router = express.Router();

router.get("/", tokenList);
router.put("/:_id", updateToken);
router.delete("/:_id", deleteToken);

module.exports = router;
