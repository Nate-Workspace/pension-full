import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('pension')
  getPension() {
    return this.publicService.getPension();
  }

  @Get('site-content')
  getSiteContent() {
    return this.publicService.getSiteContent();
  }

  @Get('rooms')
  listRooms() {
    return this.publicService.listRooms();
  }

  @Get('rooms/:id/availability')
  getRoomAvailability(@Param('id') id: string, @Query() query: unknown) {
    return this.publicService.getRoomAvailability(id, query);
  }

  @Get('rooms/:id')
  getRoomById(@Param('id') id: string) {
    return this.publicService.getRoomById(id);
  }

  @Post('bookings/checkout')
  checkoutBooking(@Body() body: unknown) {
    return this.publicService.checkoutBooking(body);
  }

  @Get('bookings/lookup')
  lookupBooking(@Query() query: unknown) {
    return this.publicService.lookupBooking(query);
  }
}
