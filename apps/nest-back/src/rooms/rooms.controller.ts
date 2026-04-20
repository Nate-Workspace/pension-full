import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  listRooms(
    @Query('status') status?: string,
    @Query('operationDay') operationDay?: string,
  ) {
    return this.roomsService.listRooms({ status, operationDay });
  }

  @Post()
  @Roles('admin')
  createRoom(@Body() body: unknown) {
    return this.roomsService.createRoom(body);
  }

  @Patch(':id')
  @Roles('admin')
  updateRoom(@Param('id') id: string, @Body() body: unknown) {
    return this.roomsService.updateRoom(id, body);
  }

  @Patch(':id/status')
  @Roles('admin')
  updateRoomStatus(@Param('id') id: string, @Body() body: unknown) {
    return this.roomsService.updateRoomStatus(id, body);
  }
}
