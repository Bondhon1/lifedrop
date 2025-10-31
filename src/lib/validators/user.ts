import { z } from "zod";

export const registerUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores are allowed"),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  name: z.string().max(100).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  bloodGroup: z
    .enum(["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"])
    .optional(),
  medicalHistory: z.string().max(5000).optional().or(z.literal("")),
  divisionId: z.coerce.number().optional(),
  districtId: z.coerce.number().optional(),
  upazilaId: z.coerce.number().optional(),
});
