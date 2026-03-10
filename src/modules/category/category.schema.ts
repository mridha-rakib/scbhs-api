import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name required."),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Category name required").optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
