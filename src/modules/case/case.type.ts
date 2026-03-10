import type { z } from "zod";
import {
  applyCaseSchema,
  createCaseSchema,
  deleteCaseSchema,
  getCaseByIdSchema,
  getCasesSchema,
  updateCaseSchema,
  updateCaseStatusSchema,
} from "./case.schema";

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type ApplyCaseInput = z.infer<typeof applyCaseSchema>;
export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>;
export type GetCasesInput = z.infer<typeof getCasesSchema>;
export type GetCaseByIdInput = z.infer<typeof getCaseByIdSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type DeleteCaseInput = z.infer<typeof deleteCaseSchema>;
