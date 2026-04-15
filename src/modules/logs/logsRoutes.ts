import { Router } from "express";
import logsControllers from "./logsControllers.js";
import middleware from "../../middleware/middleware.js";

const logsRoutes = Router();

logsRoutes.use(middleware.authenticateJWT);
logsRoutes.get("/", middleware.authorizeRole("manager"), logsControllers.getLogs);

export default logsRoutes;
