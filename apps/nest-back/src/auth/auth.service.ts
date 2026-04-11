import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users as usersTable } from '@repo/db';
import { loginSchema, registerSchema } from '@repo/contracts';
import type { AuthResponse, User as PublicUser } from '@repo/types';
import { InternalServerErrorException } from '@nestjs/common';

type DbUser = typeof usersTable.$inferSelect;

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(body: unknown): Promise<AuthResponse> {
    const input = registerSchema.parse(body);
    const existingUser = await this.findUserByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await hash(input.password, 10);

    const createdUser = await db
      .insert(usersTable)
      .values({
        email: input.email,
        password: hashedPassword,
        role: input.role,
      })
      .returning();

    const createdRecord = createdUser[0];

    if (!createdRecord) {
      throw new InternalServerErrorException('Failed to create user');
    }

    const user = this.toPublicUser(createdRecord);

    return this.createAuthResponse(user);
  }

  async validateUserCredentials(body: unknown): Promise<PublicUser> {
    const input = loginSchema.parse(body);
    const user = await this.findUserByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(input.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.toPublicUser(user);
  }

  async login(body: unknown): Promise<AuthResponse> {
    const user = await this.validateUserCredentials(body);
    return this.createAuthResponse(user);
  }

  private async findUserByEmail(email: string): Promise<DbUser | undefined> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return user;
  }

  private createAuthResponse(user: PublicUser): AuthResponse {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  }

  private toPublicUser(user: DbUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}