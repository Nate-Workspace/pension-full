import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard, type JwtRequestUser } from './jwt-auth.guard';
import type { RegisterInput, LoginInput } from '@repo/contracts';

type AuthenticatedRequest = Request & {
  user: JwtRequestUser;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginInput) {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return this.authService.getCurrentUser(req.user.userId);
  }
}
