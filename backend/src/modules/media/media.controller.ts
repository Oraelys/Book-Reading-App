import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
  ) {}

  /**
   * Upload an image
   *
   * POST /media/upload/image?ownerId=<uuid>&folder=covers
   */
  @Post('upload/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile() file: any,
    @Query('ownerId') ownerId: string,
    @Query('folder') folder: string,
  ) {
    return this.mediaService.uploadImage(
      ownerId,
      folder,
      file,
    );
  }

  /**
   * Get one media item
   *
   * GET /media/:id
   */
  @Get(':id')
  getMedia(
    @Param('id') id: string,
  ) {
    return this.mediaService.getMedia(id);
  }

  /**
   * Get all media uploaded by a user
   *
   * GET /media/user/:userId
   */
  @Get('user/:userId')
  getUserMedia(
    @Param('userId') userId: string,
  ) {
    return this.mediaService.listUserMedia(userId);
  }

  /**
   * Delete media
   *
   * DELETE /media/:id
   */
  @Delete(':id')
  deleteMedia(
    @Param('id') id: string,
  ) {
    return this.mediaService.deleteMedia(id);
  }
}