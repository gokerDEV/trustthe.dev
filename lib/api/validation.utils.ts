import { ZodSchema } from 'zod';

export class ValidationError extends Error {
  constructor(
    public readonly issues: ReadonlyArray<{ path: string; message: string }>,
    public readonly raw: unknown,
    public readonly context: string
  ) {
    super('ValidationError');
    this.name = 'ValidationError';
  }
}

export function parseWith<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const issues = r.error.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }));
  throw new ValidationError(issues, data, context);
}

/** React Query `select` için */
export function zodSelect<T>(schema: ZodSchema<T>, context: string) {
  return (raw: unknown): T => parseWith(schema, raw, context);
}
