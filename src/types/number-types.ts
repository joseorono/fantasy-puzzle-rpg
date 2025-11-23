import * as z from 'zod'; // This leads to a smaller bundle size somehow

export const integer = z.number().int().brand('Integer');
export type Integer = z.infer<typeof integer>;

export const positiveNumber = z.number().positive().brand('PositiveNumber');
export type PositiveNumber = z.infer<typeof positiveNumber>;

export const negativeNumber = z.number().negative().brand('NegativeNumber');
export type NegativeNumber = z.infer<typeof negativeNumber>;

export const probabilityNumber = z.number().min(0).max(1).brand('ProbabilityNumber');
export type ProbabilityNumber = z.infer<typeof probabilityNumber>;

