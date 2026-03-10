import { z } from "zod";

const operatingDaySchema = z.object({
  day: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  closed: z.boolean(),
  openTime: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
    }, "Time must be in HH:MM format"),
  closeTime: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);
    }, "Time must be in HH:MM format"),
});

export const createResourceSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Resource title is required"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    category: z.string().min(1, "Category is required"), // ObjectId string
    location: z.string().min(2, "Location is required"),
    servicesAvailable: z
      .array(z.string().min(1))
      .min(1, "At least one service is required"),
    visibleFor: z
      .array(z.enum(["Supervisor", "Counsellor", "Clinician"]))
      .min(1, "At least one role must be selected"),
    contactInfo: z.object({
      phoneNumber: z.string().min(10, "Phone number is required"),
      emailAddress: z.email("Valid email is required"),
      address: z.string().min(5, "Full address is required"),
    }),
    operatingHours: z
      .array(operatingDaySchema)
      .length(7, "All 7 days must be specified"),
  }),
});

export const updateResourceSchema = z.object({
  body: createResourceSchema.shape.body.partial(),
  params: z.object({
    id: z.string().min(1, "Resource ID is required"),
  }),
});

export const bookmarkResourceSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Resource ID is required"),
  }),
});

export const getResourcesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    service: z.string().optional(),
    search: z.string().optional(),
    bookmarked: z.string().optional(),
  }),
});
