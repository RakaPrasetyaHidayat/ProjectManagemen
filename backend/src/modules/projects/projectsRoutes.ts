import { Router } from "express";
import projectsControllers from "./projectsControllers.js";
import middleware from "../../middleware/middleware.js";

const projectsRoutes = Router();

projectsRoutes.get(
  "/",
  middleware.authenticateJWT,
  
  projectsControllers.getAllProjects
);


projectsRoutes.get(
  "/:id",
  middleware.authenticateJWT,
  projectsControllers.getProjectById
);


projectsRoutes.post(
  "/",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  projectsControllers.createProject
);

projectsRoutes.put(
  "/:id",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  projectsControllers.updateProject
);

projectsRoutes.delete(
  "/:id",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  projectsControllers.deleteProject
);

export default projectsRoutes;