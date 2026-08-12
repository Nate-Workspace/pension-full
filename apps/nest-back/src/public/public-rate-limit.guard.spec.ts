import { ExecutionContext, HttpException } from '@nestjs/common';
import { PublicRateLimitGuard } from './public-rate-limit.guard';

function createContext(ip = '127.0.0.1'): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        ip,
        headers: {},
      }),
    }),
  } as ExecutionContext;
}

describe('PublicRateLimitGuard', () => {
  const originalWindowMs = process.env.PUBLIC_RATE_LIMIT_WINDOW_MS;
  const originalMaxHits = process.env.PUBLIC_RATE_LIMIT_MAX;

  beforeEach(() => {
    process.env.PUBLIC_RATE_LIMIT_WINDOW_MS = '60000';
    process.env.PUBLIC_RATE_LIMIT_MAX = '3';
  });

  afterEach(() => {
    process.env.PUBLIC_RATE_LIMIT_WINDOW_MS = originalWindowMs;
    process.env.PUBLIC_RATE_LIMIT_MAX = originalMaxHits;
  });

  it('allows requests under the configured limit', () => {
    const guard = new PublicRateLimitGuard();
    const context = createContext('10.0.0.1');

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks requests once the limit is exceeded', () => {
    const guard = new PublicRateLimitGuard();
    const context = createContext('10.0.0.2');

    guard.canActivate(context);
    guard.canActivate(context);
    guard.canActivate(context);

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(() => guard.canActivate(context)).toThrow(
      'Too many requests. Please try again later.',
    );
  });

  it('tracks clients independently by IP', () => {
    const guard = new PublicRateLimitGuard();
    const firstContext = createContext('10.0.0.3');
    const secondContext = createContext('10.0.0.4');

    guard.canActivate(firstContext);
    guard.canActivate(firstContext);
    guard.canActivate(firstContext);

    expect(() => guard.canActivate(firstContext)).toThrow(HttpException);
    expect(guard.canActivate(secondContext)).toBe(true);
  });
});
