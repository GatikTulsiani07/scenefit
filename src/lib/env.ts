import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production'], {
    message: 'NODE_ENV must be development, test, or production',
  }),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid absolute URL')
    .optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

function formatValidationError(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const key = issue.path.length > 0 ? issue.path.join('.') : 'environment';
      return `${key}: ${issue.message}`;
    })
    .join('; ');
}

export function parseEnv(
  env: Record<string, string | undefined> = process.env,
): AppEnv {
  const result = envSchema.safeParse({
    NODE_ENV: env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    throw new Error(`invalid environment configuration: ${formatValidationError(result.error)}`);
  }

  return result.data;
}

export const env = parseEnv();
