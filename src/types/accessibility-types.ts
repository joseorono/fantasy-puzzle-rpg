import * as z from 'zod'; // This leads to a smaller bundle size somehow

/** Whether the player asked us to dial the motion down. Strictly opt-in — defaults to off. */
export const reducedMotionSchema = z.boolean();

/** The accessibility settings persisted to localStorage by the options menu. */
export const accessibilitySettingsSchema = z.object({
  reducedMotion: reducedMotionSchema,
});
export type AccessibilitySettings = z.infer<typeof accessibilitySettingsSchema>;
