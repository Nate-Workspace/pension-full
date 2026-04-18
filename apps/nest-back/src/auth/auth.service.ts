import {
  ConflictException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users as usersTable } from '@repo/db';
import { loginSchema, registerSchema } from '@repo/contracts';
import type { LoginInput, RegisterInput } from '@repo/contracts';
import type { User as PublicUser } from '@repo/types';

type DbUser = typeof usersTable.$inferSelect;
type RegisteredUser = Pick<PublicUser, 'id' | 'email' | 'role'>;
type AuthSession = {
  token: string;
  user: RegisteredUser;
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(body: RegisterInput): Promise<AuthSession> {
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

    return this.createAuthSession(this.toPublicUser(createdRecord));
  }

  async validateUserCredentials(body: LoginInput): Promise<PublicUser> {
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

  async login(body: LoginInput): Promise<AuthSession> {
    const user = await this.validateUserCredentials(body);
    return this.createAuthSession(user);
  }

  async getCurrentUser(userId: string): Promise<RegisteredUser> {
    const user = await this.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toRegisteredUser(user);
  }

  private async findUserByEmail(email: string): Promise<DbUser | undefined> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return user;
  }

  private async findUserById(id: string): Promise<DbUser | undefined> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    return user;
  }

  createAuthToken(user: Pick<PublicUser, 'id' | 'role'>): string {
    return this.jwtService.sign({
      userId: user.id,
      role: user.role,
    });
  }

  private createAuthSession(user: PublicUser): AuthSession {
    return {
      token: this.createAuthToken(user),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  private toRegisteredUser(user: DbUser): RegisteredUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
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
