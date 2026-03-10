import { authMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { NoteController } from "./note.controller";

const router = Router();

const noteController = new NoteController();

router.use(authMiddleware.authenticate);

router.post(
  "/",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  noteController.createNote
);

router.get("/case/:caseId", noteController.getNotesByCase);

router.get("/:id", noteController.getNoteById);

router.put(
  "/:id",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  noteController.updateNote
);

router.delete(
  "/:id",
  authMiddleware.authorize(["SuperAdmin", "Admin"]),
  noteController.deleteNote
);

export default router;
