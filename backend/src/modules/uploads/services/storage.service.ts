import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class StorageService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  private readonly bucket = 'book-assets';

  async uploadFile(
    folder: string,
    file: Buffer,
    extension: string,
    mimeType: string,
  ) {
    const filename =
      `${randomUUID()}.${extension}`;

    const path =
      `${folder}/${filename}`;

    const supabase =
      this.database.getClient();

    const { error } =
      await supabase.storage
        .from(this.bucket)
        .upload(path, file, {
          contentType: mimeType,
          upsert: false,
        });

    if (error) {
      throw new BadRequestException(
        error.message,
      );
    }

    const {
      data: { publicUrl },
    } =
      supabase.storage
        .from(this.bucket)
        .getPublicUrl(path);

    return {
      filename,
      path,
      url: publicUrl,
    };
  }

  async deleteFile(path: string) {
    const supabase =
      this.database.getClient();

    const { error } =
      await supabase.storage
        .from(this.bucket)
        .remove([path]);

    if (error) {
      throw new BadRequestException(
        error.message,
      );
    }

    return {
      success: true,
    };
  }
}