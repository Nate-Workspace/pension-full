import { config as loadEnv } from 'dotenv';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, bookings, rooms, users } from '@repo/db';

const loadEnvConfig = loadEnv as (options: { path: string; override?: boolean }) => void;

loadEnvConfig({ path: '../../.env' });
loadEnvConfig({ path: './.env', override: true });

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

async function seedUser(
  email: string,
  password: string,
  role: 'admin' | 'staff',
) {
  const existingUsers = (await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)) as Array<{ id: string }>;
  const existingUser = existingUsers[0];

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

const seedRooms = [
  {
    id: 'room-101',
    name: 'Room 101',
    number: '101',
    floor: 1,
    type: 'single' as const,
    manualStatus: 'available' as const,
    pricePerNight: 2000,
    capacity: 1,
    assignedTo: null,
  },
  {
    id: 'room-102',
    name: 'Room 102',
    number: '102',
    floor: 1,
    type: 'double' as const,
    manualStatus: 'available' as const,
    pricePerNight: 4000,
    capacity: 2,
    assignedTo: null,
  },
  {
    id: 'room-103',
    name: 'Room 103',
    number: '103',
    floor: 1,
    type: 'single' as const,
    manualStatus: 'cleaning' as const,
    pricePerNight: 2000,
    capacity: 1,
    assignedTo: 'Housekeeping A',
  },
  {
    id: 'room-201',
    name: 'Room 201',
    number: '201',
    floor: 2,
    type: 'double' as const,
    manualStatus: 'available' as const,
    pricePerNight: 4500,
    capacity: 2,
    assignedTo: null,
  },
  {
    id: 'room-202',
    name: 'Room 202',
    number: '202',
    floor: 2,
    type: 'vip' as const,
    manualStatus: 'available' as const,
    pricePerNight: 5000,
    capacity: 3,
    assignedTo: null,
  },
  {
    id: 'room-203',
    name: 'Room 203',
    number: '203',
    floor: 2,
    type: 'single' as const,
    manualStatus: 'cleaning' as const,
    pricePerNight: 2600,
    capacity: 1,
    assignedTo: 'Housekeeping B',
  },
  {
    id: 'room-301',
    name: 'Room 301',
    number: '301',
    floor: 3,
    type: 'vip' as const,
    manualStatus: 'available' as const,
    pricePerNight: 5500,
    capacity: 3,
    assignedTo: null,
  },
  {
    id: 'room-302',
    name: 'Room 302',
    number: '302',
    floor: 3,
    type: 'double' as const,
    manualStatus: 'available' as const,
    pricePerNight: 4700,
    capacity: 2,
    assignedTo: null,
  },
] as const;

const seedBookings = [
  {
    id: 'book-001',
    code: 'BG-2026-0318',
    roomId: 'room-101',
    guestName: 'Musa Diallo',
    guestPhone: '+221 77 231 8844',
    guestIdNumber: 'SN-ID-2478391',
    status: 'confirmed' as const,
    checkInDate: '2026-03-24',
    checkOutDate: '2026-03-28',
  },
  {
    id: 'book-002',
    code: 'BG-2026-0320',
    roomId: 'room-201',
    guestName: 'Koffi Mensah',
    guestPhone: '+233 24 553 9021',
    guestIdNumber: 'GH-PP-9908172',
    status: 'confirmed' as const,
    checkInDate: '2026-03-25',
    checkOutDate: '2026-03-29',
  },
  {
    id: 'book-003',
    code: 'BG-2026-0321',
    roomId: 'room-202',
    guestName: 'Fatou Sow',
    guestPhone: '+221 70 445 1192',
    guestIdNumber: 'SN-ID-3017755',
    status: 'confirmed' as const,
    checkInDate: '2026-03-26',
    checkOutDate: '2026-03-30',
  },
] as const;

async function seedRoom(room: (typeof seedRooms)[number]) {
  const existingRooms = (await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(eq(rooms.id, room.id))
    .limit(1)) as Array<{ id: string }>;
  const existingRoom = existingRooms[0];

  if (existingRoom) {
    return;
  }

  await db.insert(rooms).values(room);
}

async function seedBooking(booking: (typeof seedBookings)[number]) {
  const existingBookings = (await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.id, booking.id))
    .limit(1)) as Array<{ id: string }>;
  const existingBooking = existingBookings[0];

  if (existingBooking) {
    return;
  }

  await db.insert(bookings).values(booking);
}

async function main() {
  for (const user of seedUsers) {
    await seedUser(user.email, user.password, user.role);
  }

  for (const room of seedRooms) {
    await seedRoom(room);
  }

  for (const booking of seedBookings) {
    await seedBooking(booking);
  }
}

main()
  .then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });