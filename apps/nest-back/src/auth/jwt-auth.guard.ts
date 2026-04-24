import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@repo/types';
import type { Request } from 'express';

export interface JwtRequestUser {
  userId: string;
  role: Role;
}

type AuthenticatedRequest = Request & {
  cookies?: {
    access_token?: string;
  };
  user?: JwtRequestUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = this.jwtService.verify<JwtRequestUser>(token);

      if (
        !payload ||
        typeof payload.userId !== 'string' ||
        (payload.role !== 'admin' && payload.role !== 'staff')
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = {
        userId: payload.userId,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    return request.cookies?.access_token;
  }
}
