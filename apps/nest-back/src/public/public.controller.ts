import { Controller, Get, Param } from '@nestjs/common';
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

  @Get('rooms/:id')
  getRoomById(@Param('id') id: string) {
    return this.publicService.getRoomById(id);
  }
}
