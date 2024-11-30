import React, { useState, useEffect } from "react";
import axios from "axios";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await axios.get("/api/projects");
      setProjects(data);
    };
    fetchProjects();
  }, []);

  return (
    <div>
      <h1>Project List</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Token Name</th>
            <th>Liquidity</th>
            <th>Wallet Address</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.id}</td>
              <td>{new Date(project.date).toLocaleString()}</td>
              <td>{project.tokenName}</td>
              <td>${project.liquidity}</td>
              <td>{project.walletAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectList;
