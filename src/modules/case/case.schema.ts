import { z } from "zod";

export const createCaseSchema = z.object({
  body: z.object({
    title: z.string().min(5, "Case title must be at least 5 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),

    // client information
    client: z.object({
      fullName: z.string().min(2, "Client full name is required"),
      age: z
        .number()
        .min(1, "Age must be at least 1")
        .max(120, "Age must be less than 120"),
      gender: z.enum(["Male", "Female", "Other"]),
      phone: z.string().min(10, "Phone number is required"),
      emergencyContact: z.string().min(10, "Emergency contact is required"),
      email: z
        .string()
        .email("Invalid email format")
        .optional()
        .or(z.literal("")),
      address: z.string().min(5, "Address is required").optional(),
    }),
  }),
});

export const applyCaseSchema = z.object({
  params: z.object({
    caseId: z.string().min(1, "Case ID is required"),
  }),
});

export const updateCaseStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Ongoing", "Pending", "In Progress", "Complete"]),
  }),
});

export const getCasesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z
      .enum(["Ongoing", "Pending", "In Progress", "Complete"])
      .optional(),
    search: z.string().optional(), // Search by title, case number, or client name
    category: z.string().optional(), // Filter by category ID
    dateFrom: z.string().optional(), // Filter by start date range
    dateTo: z.string().optional(),
    assignedTo: z.enum(["assigned", "unassigned", "all"]).optional(),
  }),
});

export const getCaseByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Case ID is required"),
  }),
});

export const updateCaseSchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),
    description: z.string().min(10).optional(),
    startDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    endDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    status: z
      .enum(["Ongoing", "Pending", "In Progress", "Complete"])
      .optional(),
    client: z
      .object({
        fullName: z.string().min(2).optional(),
        age: z.number().min(1).max(120).optional(),
        gender: z.enum(["Male", "Female", "Other"]).optional(),
        phone: z.string().min(10).optional(),
        emergencyContact: z.string().min(10).optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().min(5).optional(),
      })
      .optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Case ID is required"),
  }),
});

export const deleteCaseSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Case ID is required"),
  }),
});
