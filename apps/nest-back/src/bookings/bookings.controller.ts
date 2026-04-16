import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  listBookings(@Query() query: unknown) {
    return this.bookingsService.listBookings(query);
  }

  @Post()
  createBooking(@Body() body: unknown) {
    return this.bookingsService.createBooking(body);
  }

  @Patch(':id')
  updateBooking(@Param('id') id: string, @Body() body: unknown) {
    return this.bookingsService.updateBooking(id, body);
  }

  @Post(':id/cancel')
  cancelBooking(@Param('id') id: string) {
    return this.bookingsService.cancelBooking(id);
  }

  @Post(':id/checkout')
  checkoutBooking(@Param('id') id: string) {
    return this.bookingsService.checkoutBooking(id);
  }
}