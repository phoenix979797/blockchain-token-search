const express = require("express");
const {
  tokenList,
  allList,
  addToken,
  updateToken,
  deleteToken,
  deleteAll,
} = require("../controller/tokenController");
const router = express.Router();

router.get("/", tokenList);
router.get("/all", allList);
router.post("", addToken);
router.put("/:_id", updateToken);
router.delete("/all", deleteAll);
router.delete("/:_id", deleteToken);

module.exports = router;
