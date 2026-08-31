import { z } from "zod";

const nullableStringSchema = z.string().nullable();

const agendaDisplayConfigSchema = z
  .object({
    showFilters: z.boolean().optional(),
    planningViewEnabled: z.boolean().optional(),
    calendarViewEnabled: z.boolean().optional(),
    monthViewEnabled: z.boolean().optional(),
    fourWeeksViewEnabled: z.boolean().optional(),
  })
  .nullable()
  .optional();

const integrationThemeGeneralSchema = z
  .object({
    pageTitle: nullableStringSchema.optional(),
    pageDescription: nullableStringSchema.optional(),
  })
  .nullable()
  .optional();

const integrationThemeHeaderSchema = z
  .object({
    displayHeader: z.boolean().optional(),
    mainTitle: nullableStringSchema.optional(),
    secondaryTitle: nullableStringSchema.optional(),
    displayOrganizerLink: z.boolean().optional(),
  })
  .nullable()
  .optional();

const integrationThemeSchema = z
  .object({
    logoUrl: z.string().url().nullable().optional(),
    primaryColor: z.string().trim().nullable().optional(),
    fontFamily: z.string().trim().nullable().optional(),
    general: integrationThemeGeneralSchema,
    header: integrationThemeHeaderSchema,
    agenda: agendaDisplayConfigSchema,
    display: agendaDisplayConfigSchema,
  })
  .nullable()
  .optional();

const integrationBaseFiltersSchema = z
  .object({
    category: z.array(z.string().trim().min(1)).optional(),
    venue: z.array(z.string().trim().min(1)).optional(),
    org: z.array(z.string().trim().min(1)).optional(),
  })
  .nullable()
  .optional();

export const integrationWriteSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  isActive: z.boolean().optional(),
  theme: integrationThemeSchema,
  baseFilters: integrationBaseFiltersSchema,
});

export const integrationPatchSchema = integrationWriteSchema.partial();

export type IntegrationWriteInput = z.infer<typeof integrationWriteSchema>;
export type IntegrationPatchInput = z.infer<typeof integrationPatchSchema>;
