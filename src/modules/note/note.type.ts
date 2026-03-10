import type { z } from "zod";
import {
  createNoteSchema,
  deleteNoteSchema,
  getNotesByCaseSchema,
  updateNoteSchema,
} from "./note.schema";

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>;
export type GetNotesByCaseInput = z.infer<typeof getNotesByCaseSchema>;
