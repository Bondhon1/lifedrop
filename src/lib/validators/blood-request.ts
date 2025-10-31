import { z } from "zod";

export const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const genderOptions = ["Male", "Female", "Other"] as const;
export const urgencyLevels = ["Normal", "Urgent", "Critical"] as const;
export const smokerPreferences = ["Allow Smokers", "Avoid Smokers", "No smokers"] as const;

const startOfToday = (() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
})();

export const bloodRequestFormSchema = z.object({
  patientName: z.string().trim().min(2, "Patient name must be at least 2 characters").max(100),
  gender: z.enum(genderOptions, { message: "Select a gender" }),
  requiredDate: z.coerce
    .date()
    .refine((value) => !Number.isNaN(value.getTime()), { message: "Select a valid date" })
    .refine((value) => value >= startOfToday, { message: "Required date cannot be in the past" }),
  bloodGroup: z.enum(bloodGroups, { message: "Select a blood group" }),
  amountNeeded: z.coerce
    .number()
    .refine((value) => Number.isFinite(value), { message: "Enter a valid amount" })
    .positive("Amount must be greater than zero")
    .max(10, "We currently limit requests to 10 units"),
  hospitalName: z.string().trim().min(2, "Hospital name must be at least 2 characters").max(255),
  urgencyStatus: z.enum(urgencyLevels, { message: "Select an urgency level" }),
  smokerPreference: z.enum(smokerPreferences, { message: "Select a smoker preference" }),
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(1000),
  location: z.string().trim().min(2, "Select a hospital location on the map.").max(255),
  latitude: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return Number.NaN;
      }
      const numeric = typeof value === "number" ? value : Number(value);
      return Number.isFinite(numeric) ? numeric : Number.NaN;
    })
    .refine((value) => Number.isFinite(value) && value >= -90 && value <= 90, "Select a valid location"),
  longitude: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return Number.NaN;
      }
      const numeric = typeof value === "number" ? value : Number(value);
      return Number.isFinite(numeric) ? numeric : Number.NaN;
    })
    .refine((value) => Number.isFinite(value) && value >= -180 && value <= 180, "Select a valid location"),
  divisionId: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const numeric = typeof value === "number" ? value : Number(value);
      return Number.isInteger(numeric) ? numeric : null;
    }),
  districtId: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const numeric = typeof value === "number" ? value : Number(value);
      return Number.isInteger(numeric) ? numeric : null;
    }),
  upazilaId: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const numeric = typeof value === "number" ? value : Number(value);
      return Number.isInteger(numeric) ? numeric : null;
    }),
  addressLabel: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .optional(),
});

export type BloodRequestFormValues = z.infer<typeof bloodRequestFormSchema>;
export type BloodRequestFormInput = z.input<typeof bloodRequestFormSchema>;
