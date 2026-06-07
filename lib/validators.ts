import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(max).optional()
  );

const requiredText = (max: number, label: string) =>
  z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`);

const dateField = z.preprocess(
  (value) => {
    if (value instanceof Date) return value;
    if (typeof value !== "string") return value;
    return new Date(value);
  },
  z.date().refine((date) => !Number.isNaN(date.getTime()), "Enter a valid date.")
);

export const createTimelineSchema = z.object({
  loginName: requiredText(80, "Login name"),
  timelineName: requiredText(80, "Timeline name")
});

export const joinTimelineSchema = z.object({
  loginName: requiredText(80, "Login name"),
  timelineName: requiredText(120, "Timeline name"),
  redirectTo: optionalText(300)
});

export const availabilitySchema = z
  .object({
    status: z.enum(["FREE", "BUSY"]),
    startAt: dateField,
    endAt: dateField,
    note: optionalText(160)
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "End time must be after start time.",
    path: ["endAt"]
  });

export const eventSchema = z
  .object({
    title: requiredText(120, "Event title"),
    description: optionalText(2000),
    location: optionalText(200),
    startAt: dateField,
    endAt: dateField
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "End time must be after start time.",
    path: ["endAt"]
  });

export function formEntries(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
