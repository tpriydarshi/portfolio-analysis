import { z } from "zod/v4";

export const fundEntrySchema = z.object({
  schemeCode: z.number().int().positive("Scheme code must be a positive integer"),
  schemeName: z.string().min(1, "Scheme name is required"),
  allocationPct: z
    .number()
    .min(0.01, "Allocation must be at least 0.01%")
    .max(100, "Allocation cannot exceed 100%"),
});

export const portfolioSchema = z.object({
  name: z
    .string()
    .min(1, "Portfolio name is required")
    .max(100, "Portfolio name must be under 100 characters"),
  totalValueInr: z
    .number()
    .positive("Total value must be positive")
    .max(1e12, "Value seems too large")
    .nullable()
    .optional(),
  funds: z
    .array(fundEntrySchema)
    .min(1, "At least one fund is required")
    .refine(
      (funds) => {
        const sum = funds.reduce((acc, f) => acc + f.allocationPct, 0);
        return Math.abs(sum - 100) < 0.01;
      },
      { message: "Fund allocations must sum to 100%" }
    ),
});

export type FundEntry = z.infer<typeof fundEntrySchema>;
export type PortfolioInput = z.infer<typeof portfolioSchema>;
