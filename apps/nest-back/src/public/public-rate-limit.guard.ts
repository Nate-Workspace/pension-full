import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class PublicRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, RateLimitEntry>();
  private readonly windowMs = Number(
    process.env.PUBLIC_RATE_LIMIT_WINDOW_MS ?? 60_000,
  );
  private readonly maxHits = Number(process.env.PUBLIC_RATE_LIMIT_MAX ?? 10);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.resolveClientKey(request);
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now >= entry.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxHits) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
    return true;
  }

  private resolveClientKey(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];

    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim() ?? request.ip ?? 'unknown';
    }

    return request.ip ?? 'unknown';
  }
}
