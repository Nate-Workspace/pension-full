import { config as loadEnv } from 'dotenv';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users } from '@repo/db';

loadEnv({ path: '../../.env' });
loadEnv({ path: './.env', override: true });

const seedUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin' as const,
  },
  {
    email: 'staff@example.com',
    password: 'staff123',
    role: 'staff' as const,
  },
] as const;

async function seedUser(email: string, password: string, role: 'admin' | 'staff') {
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return;
  }

  const hashedPassword = await hash(password, 10);

  await db.insert(users).values({
    email,
    password: hashedPassword,
    role,
  });
}

async function main() {
  for (const user of seedUsers) {
    await seedUser(user.email, user.password, user.role);
  }
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    process.exit(1);
  });