import type { z } from "zod";
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "./category.schema";

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
