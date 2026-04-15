"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { bookings as initialBookings, payments as initialPayments, rooms as initialRooms } from "@/data";
import type { Booking, Payment, Room } from "@/data";
import { deriveRoomsFromBookings, toIsoDate } from "@/lib/operations";

type OperationsContextValue = {
  bookings: Booking[];
  setBookings: Dispatch<SetStateAction<Booking[]>>;
  payments: Payment[];
  setPayments: Dispatch<SetStateAction<Payment[]>>;
  rooms: Room[];
  operationDay: string;
  setCleaningRoomIds: Dispatch<SetStateAction<Set<string>>>;
};

const OperationsContext = createContext<OperationsContextValue | null>(null);

type OperationsProviderProps = {
  children: ReactNode;
};

export function OperationsProvider({ children }: OperationsProviderProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [operationDay] = useState<string>(() => toIsoDate(new Date()));
  const [cleaningRoomIds, setCleaningRoomIds] = useState<Set<string>>(
    () => new Set(initialRooms.filter((room) => room.status === "cleaning").map((room) => room.id)),
  );

  const derivedRooms = useMemo(
    () => deriveRoomsFromBookings(initialRooms, bookings, cleaningRoomIds, operationDay),
    [bookings, cleaningRoomIds, operationDay],
  );

  const value = useMemo<OperationsContextValue>(
    () => ({
      bookings,
      setBookings,
      payments,
      setPayments,
      rooms: derivedRooms,
      operationDay,
      setCleaningRoomIds,
    }),
    [bookings, derivedRooms, operationDay, payments],
  );

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperationsData(): OperationsContextValue {
  const context = useContext(OperationsContext);

  if (!context) {
    throw new Error("useOperationsData must be used within OperationsProvider.");
  }

  return context;
}
