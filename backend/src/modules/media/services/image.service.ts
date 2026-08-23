import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageService {
  async optimize(
    buffer: Buffer,
  ) {
    return buffer;
  }

  async createThumbnail(
    buffer: Buffer,
  ) {
    return buffer;
  }

  async resize(
    buffer: Buffer,
    width: number,
    height: number,
  ) {
    return buffer;
  }

  async convertWebp(
    buffer: Buffer,
  ) {
    return buffer;
  }
}