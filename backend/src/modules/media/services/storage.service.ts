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

  async upload(
    folder: string,
    file: Buffer,
    extension: string,
    mimeType: string,
  ) {
    const supabase = this.database.getClient();

    const filename = `${randomUUID()}.${extension}`;

    const path = `${folder}/${filename}`;

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        upsert: false,
        contentType: mimeType,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return {
      filename,
      path,
      url: publicUrl,
    };
  }

  async delete(path: string) {
    const { error } = await this.database
      .getClient()
      .storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
    };
  }

  async getPublicUrl(path: string) {
    const {
      data: { publicUrl },
    } = this.database
      .getClient()
      .storage
      .from(this.bucket)
      .getPublicUrl(path);

    return publicUrl;
  }

  async move(
    from: string,
    to: string,
  ) {
    const { error } = await this.database
      .getClient()
      .storage
      .from(this.bucket)
      .move(from, to);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return true;
  }

  async copy(
    from: string,
    to: string,
  ) {
    const { error } = await this.database
      .getClient()
      .storage
      .from(this.bucket)
      .copy(from, to);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return true;
  }
}