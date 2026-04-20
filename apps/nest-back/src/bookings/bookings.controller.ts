import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BookingsService } from './bookings.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
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