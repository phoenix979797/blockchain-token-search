const express = require("express");
const {
  fetchProjects,
  getProjects,
} = require("../controller/projectController");
const router = express.Router();

router.get("/fetch", fetchProjects); // Fetch and save projects
router.get("/", getProjects); // Get saved projects

module.exports = router;
