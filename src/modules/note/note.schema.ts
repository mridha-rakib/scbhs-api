import { z } from "zod";

export const createNoteSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Note title is required")
      .max(200, "Title too long"),
    description: z
      .string()
      .min(1, "Note description is required")
      .max(2000, "Description too long"),
    case: z.string().min(1, "Case ID is required"), // ObjectId string
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Note title is required")
      .max(200, "Title too long")
      .optional(),
    description: z
      .string()
      .min(1, "Note description is required")
      .max(2000, "Description too long")
      .optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Note ID is required"),
  }),
});

export const deleteNoteSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Note ID is required"),
  }),
});

export const getNotesByCaseSchema = z.object({
  params: z.object({
    caseId: z.string().min(1, "Case ID is required"),
  }),
});
