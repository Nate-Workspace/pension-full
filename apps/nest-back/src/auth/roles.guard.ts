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
  constructor(private readonly reflector: Reflector) {}

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
      if (requiredRoles.includes('staff')) {
        return true;
      }

      throw new ForbiddenException('You do not have permission');
    }

    throw new ForbiddenException('You do not have permission');
  }
}