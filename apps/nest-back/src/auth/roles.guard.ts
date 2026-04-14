import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@repo/types';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';
import { JwtRequestUser } from './jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user?: JwtRequestUser;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {} // Reflector is used to read the metadata set by the @Roles() decorator

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context is missing');
    }

    if (user.role === 'admin') {
      return true;
    }

    if (user.role === 'staff') {
      // Keep staff behavior intentionally simple for now.
      return requiredRoles.includes('staff');
    }

    return false;
  }
}