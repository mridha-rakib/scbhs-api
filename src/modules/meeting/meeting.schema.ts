import { z } from "zod";

function parseTime(timeStr: string, date: Date): Date {
  const trimmed = timeStr.trim();
  const [time, modifier] = trimmed.split(/\s+/);
  let [hour, minute] = time.split(":").map(Number);

  // Handle AM/PM conversion
  if (modifier) {
    const mod = modifier.toUpperCase();
    if (mod === "PM" && hour < 12) {
      hour += 12;
    }
    if (mod === "AM" && hour === 12) {
      hour = 0;
    }
  }

  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

export const createMeetingSchema = z
  .object({
    body: z.object({
      date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
      startTime: z.string().refine((val) => {
        return (
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) ||
          /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm)$/.test(val)
        );
      }, "Start time must be in HH:MM or h:mm AM/PM format"),
      endTime: z.string().refine((val) => {
        return (
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) ||
          /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm)$/.test(val)
        );
      }, "End time must be in HH:MM or h:mm AM/PM format"),
    }),
  })
  .refine(
    // (data) => {
    //   const date = new Date(data.body.date);
    //   const [startHour, startMin] = data.body.startTime.split(":").map(Number);
    //   const [endHour, endMin] = data.body.endTime.split(":").map(Number);

    //   const start = new Date(date);
    //   start.setHours(startHour, startMin, 0, 0);

    //   const end = new Date(date);
    //   end.setHours(endHour, endMin, 0, 0);

    //   return end > start;
    // },
    // { message: "End time must be after start time" }

    (data) => {
      const date = new Date(data.body.date);
      const startTime = parseTime(data.body.startTime, date);
      const endTime = parseTime(data.body.endTime, date);
      return endTime > startTime;
    },
    { message: "End time must be after start time" }
  );

export const bookMeetingSchema = z.object({
  params: z.object({
    meetingId: z.string().min(1, "Meeting ID is required"),
  }),
});

export const cancelMeetingSchema = z.object({
  params: z.object({
    meetingId: z.string().min(1, "Meeting ID is required"),
  }),
});

export const updateMeetingSchema = z
  .object({
    body: z
      .object({
        date: z
          .string()
          .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
          .optional(),
        startTime: z.string().refine((val) => {
          return (
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) ||
            /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm)$/.test(val)
          );
        }, "Start time must be in HH:MM or h:mm AM/PM format"),
        endTime: z
          .string()
          .refine((val) => {
            return (
              /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val) ||
              /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM|am|pm)$/.test(val)
            );
          }, "End time must be in HH:MM or h:mm AM/PM format")
          .optional(),
      })
      .optional(),
    params: z.object({
      meetingId: z.string().min(1, "Meeting ID is required"),
    }),
  })
  .refine(
    (data) => {
      // Only validate if both startTime and endTime are provided
      if (!data.body || !data.body.startTime || !data.body.endTime) {
        return true;
      }
      const date = new Date(data.body.date ?? new Date());
      const startTime = parseTime(data.body.startTime!, date);
      const endTime = parseTime(data.body.endTime!, date);
      return endTime > startTime;
    },
    { message: "End time must be after start time" }
  );

export const deleteMeetingSchema = z.object({
  params: z.object({
    meetingId: z.string().min(1, "Meeting ID is required"),
  }),
});

export const updateZoomLinkSchema = z.object({
  body: z.object({
    zoomMeetingLink: z.url("Invalid Zoom link format"),
  }),
});
