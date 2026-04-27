import { config as loadEnv } from 'dotenv';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, bookings, payments, rooms, settings, users } from '@repo/db';

const loadEnvConfig = loadEnv as (options: {
  path: string;
  override?: boolean;
}) => void;

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

  const hashedPassword = await hash(password, 10);

  if (existingUser) {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        role,
      })
      .where(eq(users.id, existingUser.id));

    return;
  }

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
    handledBy: 'Front Desk A',
    isCanceled: false,
    checkedOutAt: null,
    checkInDate: '2026-03-24',
    checkOutDate: '2026-03-28',
    paidAmount: 8000,
    source: 'phone' as const,
  },
  {
    id: 'book-002',
    code: 'BG-2026-0320',
    roomId: 'room-201',
    guestName: 'Koffi Mensah',
    guestPhone: '+233 24 553 9021',
    guestIdNumber: 'GH-PP-9908172',
    handledBy: 'Night Reception',
    isCanceled: false,
    checkedOutAt: null,
    checkInDate: '2026-03-25',
    checkOutDate: '2026-03-29',
    paidAmount: 9000,
    source: 'website' as const,
  },
  {
    id: 'book-003',
    code: 'BG-2026-0321',
    roomId: 'room-202',
    guestName: 'Fatou Sow',
    guestPhone: '+221 70 445 1192',
    guestIdNumber: 'SN-ID-3017755',
    handledBy: 'Front Desk B',
    isCanceled: false,
    checkedOutAt: null,
    checkInDate: '2026-03-26',
    checkOutDate: '2026-03-30',
    paidAmount: 20000,
    source: 'agent' as const,
  },
  {
    id: 'book-004',
    code: 'BG-2026-0325',
    roomId: 'room-302',
    guestName: 'Leila Boukari',
    guestPhone: '+227 93 561 700',
    guestIdNumber: 'NE-ID-104992',
    handledBy: null,
    isCanceled: false,
    checkedOutAt: null,
    checkInDate: '2026-03-28',
    checkOutDate: '2026-03-31',
    paidAmount: 0,
    source: 'walk-in' as const,
  },
  {
    id: 'book-005',
    code: 'BG-2026-0317',
    roomId: 'room-301',
    guestName: 'David Kouassi',
    guestPhone: '+225 07 12 34 55 21',
    guestIdNumber: 'CI-PP-8052264',
    handledBy: null,
    isCanceled: true,
    checkedOutAt: null,
    checkInDate: '2026-03-23',
    checkOutDate: '2026-03-26',
    paidAmount: 0,
    source: 'website' as const,
  },
  {
    id: 'book-006',
    code: 'BG-2026-0326',
    roomId: 'room-102',
    guestName: 'Aminata Ndiaye',
    guestPhone: '+221 76 908 3341',
    guestIdNumber: 'SN-ID-2390448',
    handledBy: null,
    isCanceled: false,
    checkedOutAt: null,
    checkInDate: '2026-03-29',
    checkOutDate: '2026-04-02',
    paidAmount: 5000,
    source: 'phone' as const,
  },
] as const;

const seedPayments = [
  {
    id: 'pay-001',
    bookingId: 'book-001',
    roomId: 'room-101',
    amount: 8000,
    method: 'mobile_money' as const,
    status: 'paid' as const,
    paidAt: new Date('2026-03-24T11:03:00Z'),
    reference: 'MOMO-991823',
  },
  {
    id: 'pay-002',
    bookingId: 'book-002',
    roomId: 'room-201',
    amount: 9000,
    method: 'cash' as const,
    status: 'partial' as const,
    paidAt: new Date('2026-03-25T15:12:00Z'),
    reference: 'CASH-RECP-2201',
  },
  {
    id: 'pay-003',
    bookingId: 'book-003',
    roomId: 'room-202',
    amount: 20000,
    method: 'mobile_money' as const,
    status: 'paid' as const,
    paidAt: new Date('2026-03-26T10:45:00Z'),
    reference: 'MOMO-994020',
  },
  {
    id: 'pay-004',
    bookingId: 'book-004',
    roomId: 'room-302',
    amount: 0,
    method: 'cash' as const,
    status: 'unpaid' as const,
    paidAt: null,
    reference: 'PENDING-BG-2026-0325',
  },
  {
    id: 'pay-005',
    bookingId: 'book-006',
    roomId: 'room-102',
    amount: 5000,
    method: 'mobile_money' as const,
    status: 'partial' as const,
    paidAt: new Date('2026-03-26T13:02:00Z'),
    reference: 'MOMO-995118',
  },
] as const;

const seedSettings = {
  id: 'main',
  pensionName: 'Hillside Guest House',
  ownerName: 'Guest House Owner',
  contactPhone: '+221 77 000 9988',
  contactEmail: 'admin@hillsideguesthouse.org',
  address: 'Bole Brass',
  city: 'Addis Ababa',
  singleRoomPrice: 2200,
  doubleRoomPrice: 4400,
  vipRoomPrice: 5250,
  defaultCheckInTime: '14:00',
  defaultCheckOutTime: '11:00',
  allowWalkInBookings: 1,
  autoMarkRoomCleaningAfterCheckout: 1,
  requireIdBeforeCheckIn: 1,
  sendPaymentReminders: 1,
} as const;

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
    await db
      .update(bookings)
      .set({
        code: booking.code,
        roomId: booking.roomId,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        guestIdNumber: booking.guestIdNumber,
        handledBy: booking.handledBy ?? null,
        isCanceled: booking.isCanceled,
        checkedOutAt: booking.checkedOutAt,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        paidAmount: booking.paidAmount,
        source: booking.source,
      })
      .where(eq(bookings.id, booking.id));

    return;
  }

  await db.insert(bookings).values(booking);
}

async function seedPayment(payment: (typeof seedPayments)[number]) {
  const existingPayments = (await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.id, payment.id))
    .limit(1)) as Array<{ id: string }>;
  const existingPayment = existingPayments[0];

  if (existingPayment) {
    await db
      .update(payments)
      .set({
        bookingId: payment.bookingId,
        roomId: payment.roomId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt,
        reference: payment.reference,
      })
      .where(eq(payments.id, payment.id));

    return;
  }

  await db.insert(payments).values(payment);
}

async function seedAppSettings() {
  const existingSettings = (await db
    .select({ id: settings.id })
    .from(settings)
    .where(eq(settings.id, seedSettings.id))
    .limit(1)) as Array<{ id: string }>;
  const existingSetting = existingSettings[0];

  if (existingSetting) {
    await db
      .update(settings)
      .set({
        pensionName: seedSettings.pensionName,
        ownerName: seedSettings.ownerName,
        contactPhone: seedSettings.contactPhone,
        contactEmail: seedSettings.contactEmail,
        address: seedSettings.address,
        city: seedSettings.city,
        singleRoomPrice: seedSettings.singleRoomPrice,
        doubleRoomPrice: seedSettings.doubleRoomPrice,
        vipRoomPrice: seedSettings.vipRoomPrice,
        defaultCheckInTime: seedSettings.defaultCheckInTime,
        defaultCheckOutTime: seedSettings.defaultCheckOutTime,
        allowWalkInBookings: seedSettings.allowWalkInBookings,
        autoMarkRoomCleaningAfterCheckout:
          seedSettings.autoMarkRoomCleaningAfterCheckout,
        requireIdBeforeCheckIn: seedSettings.requireIdBeforeCheckIn,
        sendPaymentReminders: seedSettings.sendPaymentReminders,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, seedSettings.id));

    return;
  }

  await db.insert(settings).values(seedSettings);
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

  for (const payment of seedPayments) {
    await seedPayment(payment);
  }

  await seedAppSettings();
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
