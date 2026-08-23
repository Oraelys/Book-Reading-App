import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { UploadsService } from './uploads.service';


@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploads: UploadsService,
  ) {}

  @Post('cover')
  @UseInterceptors(
    FileInterceptor('file'),
  )
  uploadCover(
    @UploadedFile()
    file: any,
  ) {
    return this.uploads.uploadCover(
      file,
    );
  }

  @Post('banner')
  @UseInterceptors(
    FileInterceptor('file'),
  )
  uploadBanner(
    @UploadedFile()
    file: any,
  ) {
    return this.uploads.uploadBanner(
      file,
    );
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file'),
  )
  uploadAvatar(
    @UploadedFile()
    file: any,
  ) {
    return this.uploads.uploadAvatar(
      file,
    );
  }

  @Delete(':path')
  delete(
    @Param('path')
    path: string,
  ) {
    return this.uploads.delete(path);
  }
}