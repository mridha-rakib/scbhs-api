import type { z } from "zod";
import {
  bookMeetingSchema,
  cancelMeetingSchema,
  createMeetingSchema,
  deleteMeetingSchema,
  updateMeetingSchema,
  updateZoomLinkSchema,
} from "./meeting.schema";

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type BookMeetingInput = z.infer<typeof bookMeetingSchema>;
export type CancelMeetingInput = z.infer<typeof cancelMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type DeleteMeetingInput = z.infer<typeof deleteMeetingSchema>;
export type UpdateZoomLinkInput = z.infer<typeof updateZoomLinkSchema>;
