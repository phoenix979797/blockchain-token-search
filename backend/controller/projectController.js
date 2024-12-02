const Project = require("../model/Project");
const axios = require("axios");

// Fetch projects and save them to the database
exports.fetchProjects = async (req, res) => {
  try {
    const response = await axios.get(
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}/getTransactions`
    );

    const projects = response.data.result.filter((tx) => {
      const age =
        (Date.now() - new Date(tx.blockTimestamp)) / (1000 * 60 * 60 * 24); // Age in days
      return age < 2 && tx.value < 50;
    });

    const savedProjects = [];

    for (const project of projects) {
      const newProject = new Project({
        id: project.hash,
        date: project.blockTimestamp,
        tokenName: project.tokenName || "Unknown",
        liquidity: project.value || 0,
        walletAddress: project.from,
      });

      savedProjects.push(await newProject.save());
    }

    res.status(200).json(savedProjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all saved projects from the database
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
