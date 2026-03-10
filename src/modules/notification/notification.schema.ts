import { z } from "zod";

export const getNotificationsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isRead: z.enum(["true", "false"]).optional(),
    type: z
      .enum(["case_created", "resource_created", "case_assigned", "general"])
      .optional(),
  }),
});

export const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
});

export const deleteNotificationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
});
