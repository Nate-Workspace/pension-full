"use client";

import { MetricCard } from "@/components/ui";

import { BookingFormDrawer } from "./components/booking-form-drawer";
import { BookingsTableSection } from "./components/bookings-table-section";
import { ReservationCalendarSection } from "./components/reservation-calendar-section";
import { formatMoney, useBookingsManagement } from "./hooks/use-bookings-management";

export function BookingsManagement() {
  const {
    search,
    statusFilter,
    page,
    pageSize,
    rooms,
    pageBookings,
    roomById,
    pageMeta,
    isLoading,
    metrics,
    actionMessage,
    isFormOpen,
    formState,
    setFormState,
    formError,
    viewMonth,
    setViewMonth,
    calendarDays,
    reservationsByDay,
    updateUrlState,
    openCreate,
    openEdit,
    closeForm,
    handleCheckoutBooking,
    handleSetRoomAvailable,
    handleSaveBooking,
    handleCancelBooking,
    getMonthLabel,
    startOfMonthUTC,
  } = useBookingsManagement();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Booking Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track reservation lifecycle, manage changes, and monitor availability in calendar view.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create Booking
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Bookings" value={String(metrics.total)} />
        <MetricCard title="Confirmed" value={String(metrics.confirmed)} />
        <MetricCard title="Pending" value={String(metrics.pending)} />
        <MetricCard title="Cancelled" value={String(metrics.cancelled)} />
        <MetricCard title="Booked Revenue" value={formatMoney(metrics.monthRevenue)} />
      </section>

      <BookingsTableSection
        search={search}
        statusFilter={statusFilter}
        page={page}
        pageSize={pageSize}
        pageBookings={pageBookings}
        roomById={roomById}
        isLoading={isLoading}
        totalPages={pageMeta?.totalPages ?? 0}
        actionMessage={actionMessage}
        updateUrlState={updateUrlState}
        onCheckoutBooking={handleCheckoutBooking}
        onEditBooking={openEdit}
        onCancelBooking={handleCancelBooking}
        onSetRoomAvailable={handleSetRoomAvailable}
      />

      <ReservationCalendarSection
        viewMonth={viewMonth}
        calendarDays={calendarDays}
        reservationsByDay={reservationsByDay}
        getMonthLabel={getMonthLabel}
        onPrevMonth={() =>
          setViewMonth((current) => startOfMonthUTC(current.getUTCFullYear(), current.getUTCMonth() - 1))
        }
        onNextMonth={() =>
          setViewMonth((current) => startOfMonthUTC(current.getUTCFullYear(), current.getUTCMonth() + 1))
        }
      />

      <BookingFormDrawer
        isOpen={isFormOpen}
        rooms={rooms}
        formState={formState}
        formError={formError}
        onClose={closeForm}
        onSave={handleSaveBooking}
        onFormStateChange={setFormState}
      />
    </div>
  );
}
