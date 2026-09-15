import { describe, expect, it } from 'vitest';

import { envSchema, parseEnv } from './env';

describe('environment validation', () => {
  it('accepts a valid environment', () => {
    const env = parseEnv({
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_URL: 'https://scenefit.example',
    });

    expect(env).toEqual({
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_URL: 'https://scenefit.example',
    });
  });

  it('accepts the url as optional', () => {
    const env = parseEnv({ NODE_ENV: 'test' });

    expect(env).toEqual({ NODE_ENV: 'test' });
  });

  it('rejects an invalid app url with a clear error', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'not-a-url',
      }),
    ).toThrowError(
      /invalid environment configuration: NEXT_PUBLIC_APP_URL: NEXT_PUBLIC_APP_URL must be a valid absolute URL/
    );
  });

  it('rejects unsupported node environments', () => {
    const invalidEnv: Record<string, string | undefined> = {
      NODE_ENV: 'staging',
    };

    expect(() =>
      parseEnv(invalidEnv),
    ).toThrowError(/NODE_ENV must be development, test, or production/);
  });

  it('keeps the schema explicit for direct consumers', () => {
    expect(envSchema.shape.NODE_ENV).toBeDefined();
    expect(envSchema.shape.NEXT_PUBLIC_APP_URL).toBeDefined();
  });
});
