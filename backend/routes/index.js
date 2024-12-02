const express = require("express");
const router = express.Router();

router.use("/projects", require("./projectRoutes"));

module.exports = router;
