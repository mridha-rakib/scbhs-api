// file: src/modules/notification/notification.type.ts

import type { z } from "zod";
import {
  deleteNotificationSchema,
  getNotificationsSchema,
  markAsReadSchema,
} from "./notification.schema";

export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type DeleteNotificationInput = z.infer<typeof deleteNotificationSchema>;
