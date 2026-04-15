import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RoomsService } from "./rooms.service";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  listRooms(@Query("status") status?: string, @Query("operationDay") operationDay?: string) {
    return this.roomsService.listRooms({ status, operationDay });
  }

  @Post()
  createRoom(@Body() body: unknown) {
    return this.roomsService.createRoom(body);
  }

  @Patch(":id")
  updateRoom(@Param("id") id: string, @Body() body: unknown) {
    return this.roomsService.updateRoom(id, body);
  }

  @Patch(":id/status")
  updateRoomStatus(@Param("id") id: string, @Body() body: unknown) {
    return this.roomsService.updateRoomStatus(id, body);
  }
}