import { Router } from "express";
import authControllers from "./authControllers.js";

const authRoutes = Router();


authRoutes.post("/register", authControllers.register);

authRoutes.post("/login", authControllers.login);

export default authRoutes;