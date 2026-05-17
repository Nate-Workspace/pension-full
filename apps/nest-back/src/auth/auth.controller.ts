import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard, type JwtRequestUser } from './jwt-auth.guard';
import type { RegisterInput, LoginInput } from '@repo/contracts';

type AuthenticatedRequest = Request & {
  user: JwtRequestUser;
};

type AuthCookieResponse = Response & {
  cookie(name: string, value: string, options: CookieOptions): Response;
  clearCookie(name: string, options: CookieOptions): Response;
};

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none';
  domain?: string;
  path: '/';
  maxAge: number;
};

const AUTH_COOKIE_NAME = 'access_token';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function getAuthCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterInput,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const session = await this.authService.register(body);
    response.cookie(AUTH_COOKIE_NAME, session.token, getAuthCookieOptions());

    return { user: session.user };
  }

  @Post('login')
  async login(
    @Body() body: LoginInput,
    @Res({ passthrough: true }) response: AuthCookieResponse,
  ) {
    const session = await this.authService.login(body);
    response.cookie(AUTH_COOKIE_NAME, session.token, getAuthCookieOptions());

    return { user: session.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: AuthCookieResponse) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;

    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
    });

    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return this.authService.getCurrentUser(req.user.userId);
  }
}
