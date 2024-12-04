const express = require("express");
const {
  tokenList,
  addToken,
  updateToken,
  deleteToken,
} = require("../controller/tokenController");
const router = express.Router();

router.get("/", tokenList);
router.post("/", addToken);
router.put("/:_id", updateToken);
router.delete("/:_id", deleteToken);

module.exports = router;
