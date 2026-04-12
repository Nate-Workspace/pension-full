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
  user?: JwtRequestUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    console.log(
      'Context: ',
      context.getClass().name,
      context.getHandler().name,
    ); // Debugging line
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    console.log('Request headers: ', request.headers); // Debugging line
    const token = this.extractBearerToken(request);

    console.log('Extracted token: ', token); // Debugging line

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
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

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization; //This is the  'Bearer <token>' string here boi
    console.log('Authorization header: ', authorization); // Debugging line

    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
