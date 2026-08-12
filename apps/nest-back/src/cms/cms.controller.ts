import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CmsService } from './cms.service';

@Controller('cms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('pages')
  listPages() {
    return this.cmsService.listPages();
  }

  @Get('pages/:slug')
  getPageContent(@Param('slug') slug: string) {
    return this.cmsService.getPageContent(slug);
  }

  @Patch('pages/:slug')
  updatePageContent(@Param('slug') slug: string, @Body() body: unknown) {
    return this.cmsService.updatePageContent(slug, body);
  }

  @Get('global')
  getGlobalConfig() {
    return this.cmsService.getGlobalConfig();
  }

  @Patch('global')
  updateGlobalConfig(@Body() body: unknown) {
    return this.cmsService.updateGlobalConfig(body);
  }

  @Get('gallery')
  listGalleryItems() {
    return this.cmsService.listGalleryItems();
  }

  @Post('gallery')
  createGalleryItem(@Body() body: unknown) {
    return this.cmsService.createGalleryItem(body);
  }

  @Patch('gallery/:id')
  updateGalleryItem(@Param('id') id: string, @Body() body: unknown) {
    return this.cmsService.updateGalleryItem(id, body);
  }

  @Delete('gallery/:id')
  deleteGalleryItem(@Param('id') id: string) {
    return this.cmsService.deleteGalleryItem(id);
  }

  @Get('amenities')
  listAmenities() {
    return this.cmsService.listAmenities();
  }

  @Post('amenities')
  createAmenity(@Body() body: unknown) {
    return this.cmsService.createAmenity(body);
  }

  @Patch('amenities/:id')
  updateAmenity(@Param('id') id: string, @Body() body: unknown) {
    return this.cmsService.updateAmenity(id, body);
  }

  @Delete('amenities/:id')
  deleteAmenity(@Param('id') id: string) {
    return this.cmsService.deleteAmenity(id);
  }

  @Get('faqs')
  listFaqs() {
    return this.cmsService.listFaqs();
  }

  @Post('faqs')
  createFaq(@Body() body: unknown) {
    return this.cmsService.createFaq(body);
  }

  @Patch('faqs/:id')
  updateFaq(@Param('id') id: string, @Body() body: unknown) {
    return this.cmsService.updateFaq(id, body);
  }

  @Delete('faqs/:id')
  deleteFaq(@Param('id') id: string) {
    return this.cmsService.deleteFaq(id);
  }

  @Get('attractions')
  listAttractions() {
    return this.cmsService.listAttractions();
  }

  @Post('attractions')
  createAttraction(@Body() body: unknown) {
    return this.cmsService.createAttraction(body);
  }

  @Patch('attractions/:id')
  updateAttraction(@Param('id') id: string, @Body() body: unknown) {
    return this.cmsService.updateAttraction(id, body);
  }

  @Delete('attractions/:id')
  deleteAttraction(@Param('id') id: string) {
    return this.cmsService.deleteAttraction(id);
  }
}
