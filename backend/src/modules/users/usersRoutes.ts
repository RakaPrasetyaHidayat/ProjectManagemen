import { Router } from "express";
import usersControllers from "./usersControllers.js";
import middleware from "../../middleware/middleware.js";

const usersRoutes = Router();

/** GET /api/users/profile – Current user's own profile */
usersRoutes.get("/profile", middleware.authenticateJWT, usersControllers.getProfile);

/** GET /api/users/dashboard/stats – Dashboard stats */
usersRoutes.get(
  "/dashboard/stats",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  usersControllers.getDashboardStats
);

/** GET /api/users – List all users (for task assignment) */
usersRoutes.get(
  "/",
  middleware.authenticateJWT,
  usersControllers.getAllUsers
);

/** GET /api/users/:id */
usersRoutes.get(
  "/:id",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  usersControllers.getUserById
);

/** POST /api/users – Create user */
usersRoutes.post(
  "/",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  usersControllers.createUser
);

/** PUT /api/users/:id – Update user */
usersRoutes.put(
  "/:id",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  usersControllers.updateUser
);

/** DELETE /api/users/:id */
usersRoutes.delete(
  "/:id",
  middleware.authenticateJWT,
  middleware.authorizeRole("manager"),
  usersControllers.deleteUser
);

export default usersRoutes;