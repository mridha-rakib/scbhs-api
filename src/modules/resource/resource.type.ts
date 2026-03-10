import type { z } from "zod";
import {
  bookmarkResourceSchema,
  createResourceSchema,
  getResourcesSchema,
  updateResourceSchema,
} from "./resource.schema";

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type BookmarkResourceInput = z.infer<typeof bookmarkResourceSchema>;
export type GetResourcesInput = z.infer<typeof getResourcesSchema>;
