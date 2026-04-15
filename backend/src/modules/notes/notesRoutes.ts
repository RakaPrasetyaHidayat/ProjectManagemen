import { Router } from "express";
import notesControllers from "./notesControllers.js";
import middleware from "../../middleware/middleware.js";

const notesRoutes = Router();

notesRoutes.get("/", middleware.authenticateJWT, notesControllers.getAllNotes);
notesRoutes.get("/:id", middleware.authenticateJWT, notesControllers.getNoteById);
notesRoutes.post("/", middleware.authenticateJWT, notesControllers.createNote);
notesRoutes.put("/:id", middleware.authenticateJWT, notesControllers.updateNote);
notesRoutes.delete("/:id", middleware.authenticateJWT, notesControllers.deleteNote);

export default notesRoutes;
