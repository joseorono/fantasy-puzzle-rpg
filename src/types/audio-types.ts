import * as z from 'zod'; // This leads to a smaller bundle size somehow

/** Volume as shown in the options sliders: an integer percentage from 0 to 100. */
export const volumePercentSchema = z.number().int().min(0).max(100);
export type VolumePercent = z.infer<typeof volumePercentSchema>;

export const mutedSchema = z.boolean();

/** The audio settings persisted to localStorage by the options menu. */
export const audioSettingsSchema = z.object({
  masterVolume: volumePercentSchema,
  musicVolume: volumePercentSchema,
  sfxVolume: volumePercentSchema,
  muted: mutedSchema,
});
export type AudioSettings = z.infer<typeof audioSettingsSchema>;
