import { Body, Controller, Get, Post } from '@nestjs/common';
import type { TestType } from '@repo/types/test-type';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  createHello(@Body() createPost: TestType): string {
    return this.appService.postHello(createPost);
  }
}
